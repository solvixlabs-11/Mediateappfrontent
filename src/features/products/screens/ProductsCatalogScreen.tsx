import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { ProductDto, ProductVisualAidDto, productsApi } from "../api/productsApi";
import { colors, radii, spacing, typography, shadows } from "../../../theme";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";

interface ProductsCatalogModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProductForOrder?: (product: ProductDto) => void;
}

export const ProductsCatalogScreen: React.FC<ProductsCatalogModalProps> = ({
  visible,
  onClose,
  onSelectProductForOrder,
}) => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // E-Detailing Slide Modal state
  const [detailingProduct, setDetailingProduct] = useState<ProductDto | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  const loadData = useCallback(async () => {
    try {
      const [cats, prods] = await Promise.all([
        productsApi.getCategories().catch(() => []),
        productsApi.list({
          category: selectedCategory || undefined,
          search: searchQuery.trim() || undefined,
        }),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      loadData();
    }
  }, [visible, loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const openDetailing = (product: ProductDto) => {
    setDetailingProduct(product);
    setActiveSlideIndex(0);
  };

  const renderProductItem = ({ item }: { item: ProductDto }) => {
    const hasVisualAids = item.visual_aids && item.visual_aids.length > 0;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleCol}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
            <Text style={styles.productName}>{item.name}</Text>
            {item.strength ? <Text style={styles.strengthText}>{item.strength}</Text> : null}
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.mrpText}>₹{item.mrp.toFixed(2)}</Text>
            <Text style={styles.mrpLabel}>MRP</Text>
          </View>
        </View>

        {item.composition ? (
          <Text style={styles.compText} numberOfLines={2}>
            {item.composition}
          </Text>
        ) : null}

        <View style={styles.pricingRow}>
          <View style={styles.tag}>
            <Text style={styles.tagLabel}>PTR: </Text>
            <Text style={styles.tagVal}>₹{item.ptr.toFixed(2)}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagLabel}>PTS: </Text>
            <Text style={styles.tagVal}>₹{item.pts.toFixed(2)}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagLabel}>Pack: </Text>
            <Text style={styles.tagVal}>{item.packaging}</Text>
          </View>
        </View>

        {item.indications ? (
          <View style={styles.indicationRow}>
            <Ionicons name="medical-outline" size={13} color={colors.primary} />
            <Text style={styles.indicationText} numberOfLines={1}>
              {item.indications}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          {hasVisualAids ? (
            <TouchableOpacity
              style={styles.detailingBtn}
              onPress={() => openDetailing(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="tablet-landscape-outline" size={16} color={colors.primary} />
              <Text style={styles.detailingBtnText}>
                E-Detailing ({item.visual_aids.length} Slides)
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {onSelectProductForOrder ? (
            <TouchableOpacity
              style={styles.orderBtn}
              onPress={() => onSelectProductForOrder(item)}
            >
              <Ionicons name="cart-outline" size={16} color={colors.surface} />
              <Text style={styles.orderBtnText}>Book Order</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <ScreenHeader
            title="Products & E-Detailing"
            subtitle="Brand catalog, PTR/PTS & visual aids"
            variant="navy"
            onBack={onClose}
          />

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by brand, generic formula, SKU..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.grey} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Category Tabs */}
          <View style={styles.categoriesBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.catPill, selectedCategory === null && styles.catPillActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[styles.catPillText, selectedCategory === null && styles.catPillTextActive]}
                >
                  All Therapies
                </Text>
              </TouchableOpacity>
              {categories.map((c) => {
                const isActive = selectedCategory === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catPill, isActive && styles.catPillActive]}
                    onPress={() => setSelectedCategory(isActive ? null : c)}
                  >
                    <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading pharmaceutical catalog...</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderProductItem}
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
                  <Ionicons name="file-tray-outline" size={54} color={colors.grey} />
                  <Text style={styles.emptyTitle}>No products found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try clearing your search query or choosing another therapy category.
                  </Text>
                </View>
              }
            />
          )}

          {/* E-Detailing Full Screen Presentation Modal */}
          {detailingProduct && (
            <Modal
              visible={!!detailingProduct}
              animationType="fade"
              onRequestClose={() => setDetailingProduct(null)}
            >
              <SafeAreaView style={styles.presentationSafe}>
                <View style={styles.presentationHeader}>
                  <TouchableOpacity
                    onPress={() => setDetailingProduct(null)}
                    style={styles.closePresBtn}
                  >
                    <Ionicons name="close" size={26} color={colors.surface} />
                  </TouchableOpacity>
                  <View style={styles.presTitleBox}>
                    <Text style={styles.presTitle}>{detailingProduct.name}</Text>
                    <Text style={styles.presCategory}>{detailingProduct.category} Visual Aid</Text>
                  </View>
                  <View style={styles.slideCounterBadge}>
                    <Text style={styles.slideCounterText}>
                      Slide {activeSlideIndex + 1} / {detailingProduct.visual_aids.length}
                    </Text>
                  </View>
                </View>

                {/* Slide Canvas */}
                <View style={styles.slideCanvas}>
                  {detailingProduct.visual_aids && detailingProduct.visual_aids[activeSlideIndex] ? (
                    <View style={styles.slideContent}>
                      <View style={styles.slideBanner}>
                        <Text style={styles.slideHeadline}>
                          {detailingProduct.visual_aids[activeSlideIndex].title}
                        </Text>
                      </View>

                      <View style={styles.talkTrackBox}>
                        <View style={styles.talkTrackHeader}>
                          <Ionicons name="chatbubbles" size={18} color={colors.primary} />
                          <Text style={styles.talkTrackTitle}>Key Clinical Pitch Points</Text>
                        </View>
                        <Text style={styles.talkTrackBody}>
                          {detailingProduct.visual_aids[activeSlideIndex].key_talk_points}
                        </Text>
                      </View>

                      <View style={styles.quickSpecsCard}>
                        <Text style={styles.specTitle}>Product Specifications</Text>
                        <Text style={styles.specRow}>
                          <Text style={styles.specBold}>Composition: </Text>
                          {detailingProduct.composition}
                        </Text>
                        <Text style={styles.specRow}>
                          <Text style={styles.specBold}>Dosage: </Text>
                          {detailingProduct.dosage_guidelines || "As directed by physician"}
                        </Text>
                        <Text style={styles.specRow}>
                          <Text style={styles.specBold}>Indications: </Text>
                          {detailingProduct.indications}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Navigation Bar */}
                <View style={styles.presentationNav}>
                  <TouchableOpacity
                    style={[
                      styles.navBtn,
                      activeSlideIndex === 0 && styles.navBtnDisabled,
                    ]}
                    onPress={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activeSlideIndex === 0}
                  >
                    <Ionicons name="arrow-back" size={20} color={colors.surface} />
                    <Text style={styles.navBtnText}>Previous Slide</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.navBtn,
                      activeSlideIndex >= detailingProduct.visual_aids.length - 1 &&
                        styles.navBtnDisabled,
                    ]}
                    onPress={() =>
                      setActiveSlideIndex((prev) =>
                        Math.min(detailingProduct.visual_aids.length - 1, prev + 1)
                      )
                    }
                    disabled={activeSlideIndex >= detailingProduct.visual_aids.length - 1}
                  >
                    <Text style={styles.navBtnText}>Next Slide</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.surface} />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </Modal>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
  },
  categoriesBar: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: colors.greyLight,
    marginRight: spacing.sm,
  },
  catPillActive: {
    backgroundColor: colors.primary,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  catPillTextActive: {
    color: colors.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0369A1",
  },
  productName: {
    ...typography.subheading,
    fontSize: 16,
    color: colors.textPrimary,
  },
  strengthText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  priceBox: {
    alignItems: "flex-end",
  },
  mrpText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.navy,
  },
  mrpLabel: {
    fontSize: 9,
    color: colors.grey,
  },
  compText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
  pricingRow: {
    flexDirection: "row",
    marginTop: spacing.sm,
    backgroundColor: "#F8FAFC",
    borderRadius: radii.sm,
    padding: spacing.xs + 2,
  },
  tag: {
    flexDirection: "row",
    marginRight: spacing.md,
  },
  tagLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  tagVal: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  indicationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  indicationText: {
    fontSize: 11,
    color: colors.primary,
    marginLeft: 4,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  detailingBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  detailingBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginLeft: 4,
  },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.md,
  },
  orderBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    ...typography.heading,
    marginTop: spacing.md,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  presentationSafe: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  presentationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#1E293B",
  },
  closePresBtn: {
    padding: spacing.xs,
  },
  presTitleBox: {
    alignItems: "center",
  },
  presTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },
  presCategory: {
    fontSize: 11,
    color: "#94A3B8",
  },
  slideCounterBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  slideCounterText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.surface,
  },
  slideCanvas: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "center",
  },
  slideContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    elevation: 4,
  },
  slideBanner: {
    backgroundColor: "#E0F2F1",
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  slideHeadline: {
    ...typography.heading,
    color: colors.primaryDark,
    textAlign: "center",
  },
  talkTrackBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  talkTrackHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  talkTrackTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  talkTrackBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  quickSpecsCard: {
    padding: spacing.sm,
    backgroundColor: "#F1F5F9",
    borderRadius: radii.md,
  },
  specTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: 4,
  },
  specRow: {
    fontSize: 11,
    color: colors.textPrimary,
    marginBottom: 2,
    lineHeight: 16,
  },
  specBold: {
    fontWeight: "700",
  },
  presentationNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#1E293B",
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "700",
    marginHorizontal: 4,
  },
});
