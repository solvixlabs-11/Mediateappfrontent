import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { OrderCreateDto, OrderDto, OrderItemCreateDto, ordersApi } from "../api/ordersApi";
import { ProductDto, productsApi } from "../../products/api/productsApi";
import { ChemistDto, StockistDto, customersApi } from "../../customers/api/customersApi";
import { attendanceApi } from "../../attendance/api/attendanceApi";
import { formatDateIST, formatDateTimeIST } from "../../../shared/utils/date";
import { colors, radii, spacing, typography, shadows } from "../../../theme";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";

interface OrdersScreenProps {
  visible?: boolean;
  onClose?: () => void;
}

type TabType = "LIST" | "BOOK";

export const OrdersScreen: React.FC<OrdersScreenProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("LIST");
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Selected Order for detail modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

  // Booking Form State
  const [customerType, setCustomerType] = useState<"CHEMIST" | "STOCKIST">("CHEMIST");
  const [chemists, setChemists] = useState<ChemistDto[]>([]);
  const [stockists, setStockists] = useState<StockistDto[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState<boolean>(false);
  const [customerSearch, setCustomerSearch] = useState<string>("");

  // Product Selection for booking
  const [availableProducts, setAvailableProducts] = useState<ProductDto[]>([]);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState<boolean>(false);
  const [productSearch, setProductSearch] = useState<string>("");

  interface DraftItem extends OrderItemCreateDto {
    product_name: string;
    product_code?: string | null;
  }
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<string>("Net 30 Days");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  interface CustomerOption {
    id: number;
    name: string;
    address?: string | null;
    phone?: string | null;
  }

  const customerOptions: CustomerOption[] =
    customerType === "CHEMIST"
      ? chemists.map((c) => ({
          id: c.id,
          name: c.shop_name,
          address: c.address,
          phone: c.phone,
        }))
      : stockists.map((s) => ({
          id: s.id,
          name: s.agency_name,
          address: s.address,
          phone: s.phone,
        }));

  // Fetch orders and customers
  const loadOrders = useCallback(async () => {
    try {
      const res = await ordersApi.list({
        status: statusFilter || undefined,
      });
      setOrders(res);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter]);

  const loadCustomerAndProductData = useCallback(async () => {
    try {
      const [chemRes, stockRes, prodRes] = await Promise.all([
        customersApi.listChemists({ limit: 100 }).catch(() => []),
        customersApi.listStockists({ limit: 100 }).catch(() => []),
        productsApi.list({ limit: 100 }).catch(() => []),
      ]);
      setChemists(chemRes);
      setStockists(stockRes);
      setAvailableProducts(prodRes);
    } catch (err) {
      console.error("Failed to load master data for orders:", err);
    }
  }, []);

  useEffect(() => {
    if (visible === undefined || visible) {
      setIsLoading(true);
      loadOrders();
      loadCustomerAndProductData();
    }
  }, [visible, loadOrders, loadCustomerAndProductData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOrders();
  };

  const handleSelectCustomer = (id: number, name: string) => {
    setSelectedCustomerId(id);
    setSelectedCustomerName(name);
    setIsCustomerPickerOpen(false);
  };

  const handleAddProduct = (prod: ProductDto) => {
    const exists = draftItems.find((i) => i.product_id === prod.id);
    if (exists) {
      Alert.alert("Already Added", `${prod.name} is already in the order. You can increase its quantity.`);
      setIsProductPickerOpen(false);
      return;
    }
    const price = customerType === "STOCKIST" && prod.pts ? prod.pts : prod.ptr || prod.mrp;
    const newItem: DraftItem = {
      product_id: prod.id,
      product_name: prod.name,
      product_code: prod.code,
      quantity: 10,
      unit_price: price,
      free_quantity: 0,
    };
    setDraftItems((prev) => [...prev, newItem]);
    setIsProductPickerOpen(false);
  };

  const updateItemQuantity = (index: number, delta: number) => {
    setDraftItems((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const updateItemFreeQuantity = (index: number, delta: number) => {
    setDraftItems((prev) => {
      const updated = [...prev];
      const newFree = Math.max(0, updated[index].free_quantity + delta);
      updated[index] = { ...updated[index], free_quantity: newFree };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return draftItems.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  };

  const calculateTotalUnits = () => {
    return draftItems.reduce((acc, item) => acc + item.quantity + item.free_quantity, 0);
  };

  const handleSubmitOrder = async () => {
    // Enforce attendance check-in before order placement
    try {
      const todayAtt = await attendanceApi.getToday().catch(() => null);
      if (!todayAtt || !todayAtt.check_in_time) {
        Alert.alert(
          "Punch-In Required 🔒",
          "You must record your daily morning attendance before booking commercial orders. Please punch in on the Home dashboard first."
        );
        return;
      }
    } catch {
      // Proceed if offline or check fails
    }

    if (!selectedCustomerId) {
      Alert.alert("Required", `Please select a ${customerType.toLowerCase()} to book the order for.`);
      return;
    }
    if (draftItems.length === 0) {
      Alert.alert("Required", "Please add at least one product to the order.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: OrderCreateDto = {
        customer_type: customerType,
        customer_id: selectedCustomerId,
        payment_terms: paymentTerms,
        notes: notes.trim() || undefined,
        items: draftItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          free_quantity: item.free_quantity,
        })),
      };

      const created = await ordersApi.create(payload);
      Alert.alert(
        "Order Placed 🎉",
        `Order #${created.order_number} has been recorded! Total: ₹${created.total_amount.toFixed(2)}`
      );

      // Reset form
      setDraftItems([]);
      setSelectedCustomerId(null);
      setSelectedCustomerName("");
      setNotes("");
      setActiveTab("LIST");
      loadOrders();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || "Failed to book order";
      Alert.alert("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q))
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return colors.success;
      case "DELIVERED":
        return colors.primary;
      case "CANCELLED":
        return colors.danger;
      case "SUBMITTED":
      default:
        return colors.info;
    }
  };

  const renderOrderItem = ({ item }: { item: OrderDto }) => {
    const statusColor = getStatusColor(item.status);
    const dateFormatted = formatDateIST(item.created_at);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.8}
        onPress={() => setSelectedOrder(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderNumberRow}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            <Text style={styles.orderNumber}>{item.order_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.customerRow}>
            <View style={styles.custTypeBadge}>
              <Text style={styles.custTypeText}>{item.customer_type}</Text>
            </View>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer_name || `Customer #${item.customer_id}`}
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{dateFormatted}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Items</Text>
              <Text style={styles.detailValue}>{item.items?.length || 0} Products</Text>
            </View>
            <View style={[styles.detailCol, styles.alignRight]}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₹{item.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>View Order Breakdown</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  const content = (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title="Commercial Orders"
        subtitle="Chemist POB & Stockist Bookings"
        variant="navy"
        onBack={onClose}
        rightElement={
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => setActiveTab(activeTab === "LIST" ? "BOOK" : "LIST")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === "LIST" ? "add-circle" : "list"}
              size={16}
              color={colors.surface}
            />
            <Text style={styles.headerAddBtnText}>
              {activeTab === "LIST" ? "New Order" : "History"}
            </Text>
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === "LIST" && styles.segmentBtnActive]}
          onPress={() => setActiveTab("LIST")}
        >
          <Ionicons
            name="file-tray-full-outline"
            size={18}
            color={activeTab === "LIST" ? colors.surface : colors.textSecondary}
          />
          <Text
            style={[styles.segmentBtnText, activeTab === "LIST" && styles.segmentBtnTextActive]}
          >
            Order History ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === "BOOK" && styles.segmentBtnActive]}
          onPress={() => setActiveTab("BOOK")}
        >
          <Ionicons
            name="cart-outline"
            size={18}
            color={activeTab === "BOOK" ? colors.surface : colors.textSecondary}
          />
          <Text
            style={[styles.segmentBtnText, activeTab === "BOOK" && styles.segmentBtnTextActive]}
          >
            Book New Order
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: ORDER HISTORY */}
      {activeTab === "LIST" && (
        <View style={styles.flex1}>
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.grey} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by order # or customer..."
                placeholderTextColor={colors.grey}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.grey} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Status Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipScroll}
          >
            {[
              { label: "All Status", value: null },
              { label: "Submitted", value: "SUBMITTED" },
              { label: "Confirmed", value: "CONFIRMED" },
              { label: "Delivered", value: "DELIVERED" },
            ].map((chip) => {
              const isSelected = statusFilter === chip.value;
              return (
                <TouchableOpacity
                  key={chip.label}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setStatusFilter(chip.value)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Orders List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderOrderItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="receipt-outline" size={56} color={colors.grey} />
                  <Text style={styles.emptyTitle}>No Orders Found</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap "+ Book New Order" above to place your first commercial booking.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* TAB 2: BOOK NEW ORDER */}
      {activeTab === "BOOK" && (
        <ScrollView style={styles.flex1} contentContainerStyle={styles.bookContent}>
          {/* Customer Type Selector */}
          <Text style={styles.sectionHeading}>1. Select Customer Type</Text>
          <View style={styles.custTypeToggleRow}>
            <TouchableOpacity
              style={[
                styles.custTypeToggleBtn,
                customerType === "CHEMIST" && styles.custTypeToggleBtnActive,
              ]}
              onPress={() => {
                setCustomerType("CHEMIST");
                setSelectedCustomerId(null);
                setSelectedCustomerName("");
              }}
            >
              <Ionicons
                name="medkit-outline"
                size={20}
                color={customerType === "CHEMIST" ? colors.primaryDark : colors.textSecondary}
              />
              <Text
                style={[
                  styles.custTypeToggleText,
                  customerType === "CHEMIST" && styles.custTypeToggleTextActive,
                ]}
              >
                Chemist / Pharmacy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.custTypeToggleBtn,
                customerType === "STOCKIST" && styles.custTypeToggleBtnActive,
              ]}
              onPress={() => {
                setCustomerType("STOCKIST");
                setSelectedCustomerId(null);
                setSelectedCustomerName("");
              }}
            >
              <Ionicons
                name="business-outline"
                size={20}
                color={customerType === "STOCKIST" ? colors.primaryDark : colors.textSecondary}
              />
              <Text
                style={[
                  styles.custTypeToggleText,
                  customerType === "STOCKIST" && styles.custTypeToggleTextActive,
                ]}
              >
                Stockist / Distributor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Customer Selection Field */}
          <Text style={styles.inputLabel}>
            {customerType === "CHEMIST" ? "Chemist Name *" : "Stockist Name *"}
          </Text>
          <TouchableOpacity
            style={styles.pickerSelector}
            onPress={() => setIsCustomerPickerOpen(true)}
          >
            <View style={styles.pickerSelectorLeft}>
              <Ionicons
                name={customerType === "CHEMIST" ? "medkit" : "business"}
                size={18}
                color={colors.primary}
              />
              <Text
                style={[
                  styles.pickerSelectorText,
                  !selectedCustomerName && styles.placeholderText,
                ]}
              >
                {selectedCustomerName || `Select ${customerType.toLowerCase()}...`}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Products Section */}
          <View style={styles.productsHeaderRow}>
            <Text style={styles.sectionHeading}>2. Order Line Items ({draftItems.length})</Text>
            <TouchableOpacity
              style={styles.addProdBtn}
              onPress={() => setIsProductPickerOpen(true)}
            >
              <Ionicons name="add" size={18} color={colors.surface} />
              <Text style={styles.addProdBtnText}>Add Product</Text>
            </TouchableOpacity>
          </View>

          {draftItems.length === 0 ? (
            <View style={styles.noItemsBox}>
              <Ionicons name="cart-outline" size={36} color={colors.grey} />
              <Text style={styles.noItemsText}>No products added to this order yet</Text>
              <TouchableOpacity
                style={styles.browseCatalogLink}
                onPress={() => setIsProductPickerOpen(true)}
              >
                <Text style={styles.browseCatalogLinkText}>Browse Catalog & Add Items</Text>
              </TouchableOpacity>
            </View>
          ) : (
            draftItems.map((item, index) => {
              const lineTotal = item.quantity * item.unit_price;
              return (
                <View key={item.product_id} style={styles.draftItemCard}>
                  <View style={styles.draftItemHeader}>
                    <View style={styles.draftItemTitleCol}>
                      <Text style={styles.draftItemName}>{item.product_name}</Text>
                      {item.product_code ? (
                        <Text style={styles.draftItemCode}>SKU: {item.product_code}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity onPress={() => removeItem(index)}>
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.draftItemControlsRow}>
                    {/* Rate */}
                    <View style={styles.rateCol}>
                      <Text style={styles.controlLabel}>Rate (₹)</Text>
                      <Text style={styles.rateValue}>₹{item.unit_price.toFixed(2)}</Text>
                    </View>

                    {/* Quantity Stepper */}
                    <View style={styles.stepperCol}>
                      <Text style={styles.controlLabel}>Billed Qty</Text>
                      <View style={styles.stepperRow}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateItemQuantity(index, -5)}
                        >
                          <Ionicons name="remove" size={16} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateItemQuantity(index, 5)}
                        >
                          <Ionicons name="add" size={16} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Free Qty Stepper */}
                    <View style={styles.stepperCol}>
                      <Text style={styles.controlLabel}>Free / Scheme</Text>
                      <View style={styles.stepperRow}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateItemFreeQuantity(index, -1)}
                        >
                          <Ionicons name="remove" size={16} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{item.free_quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateItemFreeQuantity(index, 1)}
                        >
                          <Ionicons name="add" size={16} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.draftItemSubtotalRow}>
                    <Text style={styles.subtotalLabel}>Line Total:</Text>
                    <Text style={styles.subtotalValue}>
                      ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {/* Payment Terms & Notes */}
          <Text style={styles.sectionHeading}>3. Terms & Delivery</Text>
          <Text style={styles.inputLabel}>Payment Terms</Text>
          <View style={styles.termsRow}>
            {["Net 30 Days", "Net 45 Days", "Cash on Delivery", "Advance"].map((term) => (
              <TouchableOpacity
                key={term}
                style={[
                  styles.termChip,
                  paymentTerms === term && styles.termChipActive,
                ]}
                onPress={() => setPaymentTerms(term)}
              >
                <Text
                  style={[
                    styles.termChipText,
                    paymentTerms === term && styles.termChipTextActive,
                  ]}
                >
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Special Instructions / Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Priority dispatch required for critical antibiotic stock"
            placeholderTextColor={colors.grey}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          {/* Bill Summary Box */}
          <View style={styles.billSummaryBox}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Total Product Items</Text>
              <Text style={styles.summaryVal}>{draftItems.length} SKUs</Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Total Units (Billed + Free)</Text>
              <Text style={styles.summaryVal}>{calculateTotalUnits()} Packs</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryTotalLine}>
              <Text style={styles.summaryGrandLabel}>Net Payable Amount</Text>
              <Text style={styles.summaryGrandValue}>
                ₹{calculateTotal().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (isSubmitting || draftItems.length === 0 || !selectedCustomerId) &&
                styles.submitBtnDisabled,
            ]}
            disabled={isSubmitting || draftItems.length === 0 || !selectedCustomerId}
            onPress={handleSubmitOrder}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color={colors.surface} />
                <Text style={styles.submitBtnText}>Book & Confirm Order</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Customer Picker Modal */}
      <Modal visible={isCustomerPickerOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>
                Select {customerType === "CHEMIST" ? "Chemist" : "Stockist"}
              </Text>
              <TouchableOpacity onPress={() => setIsCustomerPickerOpen(false)}>
                <Ionicons name="close" size={24} color={colors.navy} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.grey} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, contact or address..."
                placeholderTextColor={colors.grey}
                value={customerSearch}
                onChangeText={setCustomerSearch}
              />
            </View>

            <FlatList
              data={customerOptions.filter((c) =>
                c.name.toLowerCase().includes(customerSearch.toLowerCase())
              )}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.customerOptionItem}
                  onPress={() => handleSelectCustomer(item.id, item.name)}
                >
                  <View style={styles.customerOptionIcon}>
                    <Ionicons
                      name={customerType === "CHEMIST" ? "medkit" : "business"}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.customerOptionInfo}>
                    <Text style={styles.customerOptionName}>{item.name}</Text>
                    {item.address ? (
                      <Text style={styles.customerOptionSub} numberOfLines={1}>
                        {item.address}
                      </Text>
                    ) : null}
                    {item.phone ? (
                      <Text style={styles.customerOptionPhone}>📞 {item.phone}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Product Picker Modal */}
      <Modal visible={isProductPickerOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Add Product from Catalog</Text>
              <TouchableOpacity onPress={() => setIsProductPickerOpen(false)}>
                <Ionicons name="close" size={24} color={colors.navy} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.grey} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products or category..."
                placeholderTextColor={colors.grey}
                value={productSearch}
                onChangeText={setProductSearch}
              />
            </View>

            <FlatList
              data={availableProducts.filter(
                (p) =>
                  p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.category.toLowerCase().includes(productSearch.toLowerCase())
              )}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const applicablePrice =
                  customerType === "STOCKIST" && item.pts
                    ? item.pts
                    : item.ptr || item.mrp;
                return (
                  <TouchableOpacity
                    style={styles.productOptionCard}
                    onPress={() => handleAddProduct(item)}
                  >
                    <View style={styles.productOptionLeft}>
                      <View style={styles.miniCategoryBadge}>
                        <Text style={styles.miniCategoryText}>{item.category}</Text>
                      </View>
                      <Text style={styles.productOptionName}>{item.name}</Text>
                      {item.strength ? (
                        <Text style={styles.productOptionStrength}>{item.strength}</Text>
                      ) : null}
                    </View>
                    <View style={styles.productOptionRight}>
                      <Text style={styles.productOptionPrice}>₹{applicablePrice.toFixed(2)}</Text>
                      <View style={styles.addPill}>
                        <Ionicons name="add" size={14} color={colors.surface} />
                        <Text style={styles.addPillText}>Add</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedOrder && (
              <>
                <View style={styles.detailModalHeader}>
                  <View>
                    <Text style={styles.detailModalTitle}>{selectedOrder.order_number}</Text>
                    <Text style={styles.detailModalSub}>
                      Placed on {formatDateTimeIST(selectedOrder.created_at)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                    <Ionicons name="close" size={24} color={colors.navy} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: spacing.md }}>
                  {/* Customer Info */}
                  <View style={styles.detailCustBox}>
                    <Text style={styles.detailCustLabel}>CUSTOMER</Text>
                    <Text style={styles.detailCustName}>
                      {selectedOrder.customer_name || `Customer #${selectedOrder.customer_id}`}
                    </Text>
                    <Text style={styles.detailCustType}>Type: {selectedOrder.customer_type}</Text>
                    {selectedOrder.payment_terms ? (
                      <Text style={styles.detailCustTerms}>
                        Payment Terms: {selectedOrder.payment_terms}
                      </Text>
                    ) : null}
                  </View>

                  {/* Status Box */}
                  <View style={styles.statusDisplayRow}>
                    <Text style={styles.statusLabelText}>Order Status:</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(selectedOrder.status)}18` },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(selectedOrder.status) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(selectedOrder.status) },
                        ]}
                      >
                        {selectedOrder.status}
                      </Text>
                    </View>
                  </View>

                  {/* Line Items List */}
                  <Text style={styles.sectionHeading}>
                    Items Ordered ({selectedOrder.items?.length || 0})
                  </Text>
                  {selectedOrder.items?.map((it) => (
                    <View key={it.id} style={styles.itemDetailRow}>
                      <View style={styles.itemDetailCol1}>
                        <Text style={styles.itemName}>
                          {it.product_name || `Product #${it.product_id}`}
                        </Text>
                        <Text style={styles.itemQtyText}>
                          Qty: {it.quantity} {it.free_quantity ? `+ Free: ${it.free_quantity}` : ""}
                        </Text>
                      </View>
                      <View style={styles.itemDetailCol2}>
                        <Text style={styles.itemRate}>@ ₹{it.unit_price.toFixed(2)}</Text>
                        <Text style={styles.itemTotal}>₹{it.total_price.toFixed(2)}</Text>
                      </View>
                    </View>
                  ))}

                  {/* Grand Total */}
                  <View style={styles.detailTotalCard}>
                    <Text style={styles.detailTotalLabel}>Grand Total</Text>
                    <Text style={styles.detailTotalAmount}>
                      ₹{selectedOrder.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </Text>
                  </View>

                  {selectedOrder.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesLabel}>Notes / Instructions:</Text>
                      <Text style={styles.notesContent}>{selectedOrder.notes}</Text>
                    </View>
                  ) : null}
                </ScrollView>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );

  if (visible !== undefined) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        {content}
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },
  headerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: radii.full,
  },
  headerAddBtnText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: "700",
    fontSize: 12,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: colors.greyLight,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: radii.md,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  segmentBtnTextActive: {
    color: colors.surface,
    fontWeight: "700",
  },
  searchBarContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  filterChipScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.lightPrimary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  orderNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderNumber: {
    ...typography.subheading,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardBody: {
    marginVertical: spacing.xs,
    gap: spacing.xs,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  custTypeBadge: {
    backgroundColor: colors.greyLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  custTypeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  customerName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginTop: 4,
  },
  detailCol: {
    gap: 2,
  },
  alignRight: {
    alignItems: "flex-end",
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  totalValue: {
    ...typography.subheading,
    color: colors.primaryDark,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 2,
  },
  viewDetailsText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },

  // BOOKING TAB STYLES
  bookContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeading: {
    ...typography.subheading,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  custTypeToggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  custTypeToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  custTypeToggleBtnActive: {
    backgroundColor: colors.lightPrimary,
    borderColor: colors.primary,
  },
  custTypeToggleText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  custTypeToggleTextActive: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pickerSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  pickerSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  pickerSelectorText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  placeholderText: {
    color: colors.grey,
  },
  productsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  addProdBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  addProdBtnText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: "700",
  },
  noItemsBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  noItemsText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  browseCatalogLink: {
    marginTop: 4,
  },
  browseCatalogLinkText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "700",
  },
  draftItemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  draftItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  draftItemTitleCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  draftItemName: {
    ...typography.subheading,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  draftItemCode: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  draftItemControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rateCol: {
    flex: 1,
  },
  controlLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginBottom: 2,
  },
  rateValue: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  stepperCol: {
    alignItems: "center",
    marginHorizontal: 4,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.greyLight,
    borderRadius: radii.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  stepperBtn: {
    padding: 4,
  },
  stepperValue: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: "center",
  },
  draftItemSubtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: 6,
  },
  subtotalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  subtotalValue: {
    ...typography.subheading,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  termsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.md,
  },
  termChip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  termChipActive: {
    backgroundColor: colors.lightPrimary,
    borderColor: colors.primary,
  },
  termChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  termChipTextActive: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...typography.body,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  billSummaryBox: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.border,
  },
  summaryVal: {
    ...typography.bodyMedium,
    color: colors.surface,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: spacing.xs,
  },
  summaryTotalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  summaryGrandLabel: {
    ...typography.subheading,
    color: colors.surface,
    fontWeight: "700",
  },
  summaryGrandValue: {
    ...typography.title,
    color: "#34D399",
    fontWeight: "800",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    ...typography.subheading,
    color: colors.surface,
    fontWeight: "700",
  },

  // MODAL OVERLAYS & SHEETS
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: "85%",
    padding: spacing.md,
    gap: spacing.sm,
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.xs,
  },
  pickerModalTitle: {
    ...typography.subheading,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  customerOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  customerOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.lightPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  customerOptionInfo: {
    flex: 1,
  },
  customerOptionName: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  customerOptionSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  customerOptionPhone: {
    ...typography.caption,
    color: colors.primaryDark,
    marginTop: 2,
  },
  productOptionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productOptionLeft: {
    flex: 1,
    gap: 2,
  },
  miniCategoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.greyLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
  },
  miniCategoryText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  productOptionName: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  productOptionStrength: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  productOptionRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  productOptionPrice: {
    ...typography.subheading,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  addPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  addPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.surface,
  },

  // ORDER DETAIL MODAL
  detailModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: "90%",
    flex: 1,
  },
  detailModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailModalTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  detailModalSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailCustBox: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailCustLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  detailCustName: {
    ...typography.subheading,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },
  detailCustType: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailCustTerms: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "600",
    marginTop: 4,
  },
  statusDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  statusLabelText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  itemDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemDetailCol1: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  itemQtyText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemDetailCol2: {
    alignItems: "flex-end",
  },
  itemRate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  itemTotal: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  detailTotalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.lightPrimary,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailTotalLabel: {
    ...typography.subheading,
    fontWeight: "700",
    color: colors.navy,
  },
  detailTotalAmount: {
    ...typography.heading,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  notesBox: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesLabel: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  notesContent: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
