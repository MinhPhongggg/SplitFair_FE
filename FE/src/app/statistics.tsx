import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useCurrentApp } from "@/context/app.context";
import { useGetGroups } from "@/api/hooks";
import { getExpensesByGroup, getSharesByUser } from "@/api/expense";
import { getPersonalStatistics } from "@/api/stats";
import { Expense, ExpenseShare } from "@/types/expense.types";
import { APP_COLOR } from "@/utils/constant";
import {
  format,
  subDays,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  isSameWeek,
  subWeeks,
  addWeeks,
  subMonths,
  addMonths,
  startOfDay,
  endOfDay,
  addDays,
} from "date-fns";
import { vi } from "date-fns/locale";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");
const CHART_HEIGHT = 220;
const X_AXIS_HEIGHT = 30;
const PLOT_HEIGHT = CHART_HEIGHT - X_AXIS_HEIGHT;

const StatisticsScreen = () => {
  const router = useRouter();
  const { appState } = useCurrentApp();
  const userId = appState?.userId;
  const { data: groups } = useGetGroups();

  const [loading, setLoading] = useState(true);
  const [statType, setStatType] = useState<"share" | "paid">("share");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{
    label: string;
    value: number;
  } | null>(null);

  const [totals, setTotals] = useState({ share: 0, paid: 0 });
  const [displayData, setDisplayData] = useState<{
    chart: { label: string; value: number; fullDate?: Date }[];
    list: any[];
    dateRangeLabel: string;
  }>({ chart: [], list: [], dateRangeLabel: "" });

  const handlePrev = () => {
    if (viewMode === "week") setCurrentDate((prev) => subWeeks(prev, 1));
    else if (viewMode === "month") setCurrentDate((prev) => subMonths(prev, 1));
    else setCurrentDate((prev) => subDays(prev, 1));
  };

  const handleNext = () => {
    if (viewMode === "week") setCurrentDate((prev) => addWeeks(prev, 1));
    else if (viewMode === "month") setCurrentDate((prev) => addMonths(prev, 1));
    else setCurrentDate((prev) => addDays(prev, 1));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !groups) return;
      setLoading(true);
      try {
        let chartData: { label: string; value: number; fullDate?: Date }[] = [];
        let list: any[] = [];
        let shareTotal = 0;
        let paidTotal = 0;
        let dateRangeLabel = "";

        // Calculate Date Range Label & Ranges
        let start: Date, end: Date;
        if (viewMode === "week") {
          start = startOfWeek(currentDate, { locale: vi, weekStartsOn: 1 });
          end = endOfWeek(currentDate, { locale: vi, weekStartsOn: 1 });
          dateRangeLabel = `${format(start, "dd/MM")} - ${format(
            end,
            "dd/MM/yyyy"
          )}`;
        } else if (viewMode === "month") {
          start = startOfMonth(currentDate);
          end = endOfMonth(currentDate);
          dateRangeLabel = format(currentDate, "MM/yyyy");
        } else {
          start = startOfDay(currentDate);
          end = endOfDay(currentDate);
          dateRangeLabel = format(currentDate, "dd/MM/yyyy");
        }

        // --- Fetch All Data ---
        const userShares = await getSharesByUser(String(userId));
        const expensePromises = groups.map((g) => getExpensesByGroup(g.id));
        const expensesArrays = await Promise.all(expensePromises);
        const allExpenses = expensesArrays.flat();

        const expensesMap: Record<string, Expense> = {};
        allExpenses.forEach((e) => {
          expensesMap[e.id] = e;
        });

        // --- 1. Calculate Share (Thực chi) ---
        const validShares = userShares.filter((s) => expensesMap[s.expenseId]);
        const filteredShares = validShares.filter((s) => {
          const eDate = parseISO(expensesMap[s.expenseId].createdTime);
          return eDate >= start && eDate <= end;
        });
        shareTotal = filteredShares.reduce((sum, s) => sum + s.shareAmount, 0);

        // --- 2. Calculate Paid (Đã trả) ---
        const paidExpenses = allExpenses.filter(
          (e) => e.paidBy === String(userId)
        );
        const filteredPaid = paidExpenses.filter((e) => {
          const eDate = parseISO(e.createdTime);
          return eDate >= start && eDate <= end;
        });
        paidTotal = filteredPaid.reduce((sum, e) => sum + e.amount, 0);

        // --- Generate Chart & List based on StatType ---
        if (statType === "share") {
          list = filteredShares
            .map((s) => ({
              ...s,
              expense: expensesMap[s.expenseId],
            }))
            .sort(
              (a, b) =>
                new Date(b.expense.createdTime).getTime() -
                new Date(a.expense.createdTime).getTime()
            );

          if (viewMode === "week") {
            const days = eachDayOfInterval({ start, end });
            chartData = days.map((day) => {
              const dayShares = validShares.filter((s) => {
                const eDate = parseISO(expensesMap[s.expenseId].createdTime);
                return isSameDay(eDate, day);
              });
              return {
                label: format(day, "EE", { locale: vi }),
                value: dayShares.reduce((sum, s) => sum + s.shareAmount, 0),
                fullDate: day,
              };
            });
          } else if (viewMode === "month") {
            const startLoop = startOfWeek(start, {
              locale: vi,
              weekStartsOn: 1,
            });
            const endLoop = endOfWeek(end, { locale: vi, weekStartsOn: 1 });
            const weeks = eachWeekOfInterval(
              { start: startLoop, end: endLoop },
              { locale: vi, weekStartsOn: 1 }
            );

            chartData = weeks.map((weekStart, index) => {
              const weekEnd = endOfWeek(weekStart, {
                locale: vi,
                weekStartsOn: 1,
              });
              const actualEnd = weekEnd > end ? end : weekEnd;
              const actualStart = weekStart < start ? start : weekStart;

              if (actualStart > actualEnd)
                return { label: format(weekStart, "dd/MM"), value: 0 };

              const weekShares = validShares.filter((s) => {
                const eDate = parseISO(expensesMap[s.expenseId].createdTime);
                return eDate >= actualStart && eDate <= actualEnd;
              });
              return {
                label: format(weekStart, "dd/MM"),
                value: weekShares.reduce((sum, s) => sum + s.shareAmount, 0),
              };
            });
          } else {
            chartData = [
              {
                label: format(currentDate, "EE", { locale: vi }),
                value: shareTotal,
              },
            ];
          }
        } else {
          // Paid Logic
          list = filteredPaid
            .map((e) => ({
              id: e.id,
              expense: e,
              shareAmount: e.amount, // Map amount to shareAmount for display compatibility
            }))
            .sort(
              (a, b) =>
                new Date(b.expense.createdTime).getTime() -
                new Date(a.expense.createdTime).getTime()
            );

          if (viewMode === "week") {
            const days = eachDayOfInterval({ start, end });
            chartData = days.map((day) => {
              const dayExpenses = paidExpenses.filter((e) =>
                isSameDay(parseISO(e.createdTime), day)
              );
              return {
                label: format(day, "EE", { locale: vi }),
                value: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
                fullDate: day,
              };
            });
          } else if (viewMode === "month") {
            const startLoop = startOfWeek(start, {
              locale: vi,
              weekStartsOn: 1,
            });
            const endLoop = endOfWeek(end, { locale: vi, weekStartsOn: 1 });
            const weeks = eachWeekOfInterval(
              { start: startLoop, end: endLoop },
              { locale: vi, weekStartsOn: 1 }
            );

            chartData = weeks.map((weekStart, index) => {
              const weekEnd = endOfWeek(weekStart, {
                locale: vi,
                weekStartsOn: 1,
              });
              const actualEnd = weekEnd > end ? end : weekEnd;
              const actualStart = weekStart < start ? start : weekStart;

              if (actualStart > actualEnd)
                return { label: format(weekStart, "dd/MM"), value: 0 };

              const weekExpenses = paidExpenses.filter((e) => {
                const eDate = parseISO(e.createdTime);
                return eDate >= actualStart && eDate <= actualEnd;
              });
              return {
                label: format(weekStart, "dd/MM"),
                value: weekExpenses.reduce((sum, e) => sum + e.amount, 0),
              };
            });
          } else {
            chartData = [
              {
                label: format(currentDate, "EE", { locale: vi }),
                value: paidTotal,
              },
            ];
          }
        }

        setTotals({ share: shareTotal, paid: paidTotal });
        setDisplayData({ chart: chartData, list, dateRangeLabel });
      } catch (error) {
        console.error("Error fetching stats data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, groups, statType, viewMode, currentDate]);

  useEffect(() => {
    setSelectedPoint(null);
  }, [viewMode, currentDate, statType]);

  // --- Chart Calculations ---
  const { maxChartValue, yAxisLabels } = useMemo(() => {
    const maxValue = Math.max(...displayData.chart.map((d) => d.value), 0);

    if (maxValue === 0) {
      return { maxChartValue: 100, yAxisLabels: ["0", "0", "0", "0"] };
    }

    // Calculate "nice" steps for Y-axis (3 intervals)
    const roughStep = maxValue / 3;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalizedStep = roughStep / magnitude;

    let niceStep;
    if (normalizedStep <= 1) niceStep = 1;
    else if (normalizedStep <= 2) niceStep = 2;
    else if (normalizedStep <= 5) niceStep = 5;
    else niceStep = 10;

    const step = niceStep * magnitude;
    const newMax = step * 3;

    const labels = [newMax, (newMax * 2) / 3, newMax / 3, 0].map((v) => {
      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
      if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
      return Math.round(v).toString();
    });

    return { maxChartValue: newMax, yAxisLabels: labels };
  }, [displayData.chart]);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  const viewModeLabels: Record<string, string> = {
    day: "Ngày",
    week: "Tuần",
    month: "Tháng",
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: "Thống kê chi tiêu", headerBackTitle: "Trở về" }}
      />

      {/* Header with Dropdown & Date Nav */}
      <View style={styles.headerContainer}>
        {/* Dropdown Trigger */}
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dropdownText}>{viewModeLabels[viewMode]}</Text>
          <Ionicons name="chevron-down" size={16} color="#333" />
        </TouchableOpacity>

        {/* Date Nav */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color="#666" />
          </TouchableOpacity>
          <Text style={styles.dateLabel}>{displayData.dateRangeLabel}</Text>
          <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Modal - Removed, using absolute view below */}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={[
              styles.card,
              statType === "share" ? styles.activeCard : styles.inactiveCard,
            ]}
            onPress={() => setStatType("share")}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name="wallet-outline"
                size={20}
                color={statType === "share" ? "white" : "#666"}
              />
              <Text
                style={[
                  styles.cardTitle,
                  statType === "share" ? { color: "white" } : { color: "#666" },
                ]}
              >
                Chi Tiêu
              </Text>
            </View>
            <Text
              style={[
                styles.cardValue,
                statType === "share" ? { color: "white" } : { color: "#333" },
              ]}
            >
              {totals.share.toLocaleString("vi-VN")} đ
            </Text>
            {statType === "share" && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.card,
              statType === "paid" ? styles.activeCard : styles.inactiveCard,
            ]}
            onPress={() => setStatType("paid")}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name="cash-outline"
                size={20}
                color={statType === "paid" ? "white" : "#666"}
              />
              <Text
                style={[
                  styles.cardTitle,
                  statType === "paid" ? { color: "white" } : { color: "#666" },
                ]}
              >
                Đã trả
              </Text>
            </View>
            <Text
              style={[
                styles.cardValue,
                statType === "paid" ? { color: "white" } : { color: "#333" },
              ]}
            >
              {totals.paid.toLocaleString("vi-VN")} đ
            </Text>
            {statType === "paid" && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={APP_COLOR.ORANGE}
            style={{ marginTop: 50 }}
          />
        ) : (
          <>
            {/* Chart Section */}
            <View style={styles.chartSection}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Biểu đồ</Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  height: CHART_HEIGHT,
                  alignItems: "flex-end",
                }}
              >
                {/* Y-Axis */}
                <View
                  style={{
                    justifyContent: "space-between",
                    height: "100%",
                    paddingBottom: X_AXIS_HEIGHT,
                    paddingRight: 10,
                    width: 40,
                  }}
                >
                  {yAxisLabels.map((label, i) => (
                    <Text
                      key={i}
                      style={{
                        fontSize: 10,
                        color: "#999",
                        textAlign: "right",
                      }}
                    >
                      {label}
                    </Text>
                  ))}
                </View>

                {/* Chart Area */}
                <View style={{ flex: 1, height: "100%" }}>
                  {/* Grid Lines */}
                  <View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      justifyContent: "space-between",
                      paddingBottom: X_AXIS_HEIGHT,
                    }}
                  >
                    {yAxisLabels.map((_, i) => (
                      <View
                        key={i}
                        style={{
                          borderTopWidth: 1,
                          borderColor: "#eee",
                          borderStyle: "dashed",
                          width: "100%",
                          height: 1,
                        }}
                      />
                    ))}
                  </View>

                  {/* Bars */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      flex: 1,
                      paddingBottom: 0,
                    }}
                  >
                    {displayData.chart.map((d, i) => {
                      const barHeight = (d.value / maxChartValue) * PLOT_HEIGHT;
                      const isSelected = selectedPoint?.label === d.label;
                      const isMax =
                        d.value ===
                          Math.max(...displayData.chart.map((x) => x.value)) &&
                        d.value > 0;

                      return (
                        <TouchableOpacity
                          key={i}
                          style={{
                            alignItems: "center",
                            flex: 1,
                            height: "100%",
                            justifyContent: "flex-end",
                          }}
                          onPress={() => setSelectedPoint(d)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={{
                              width: 20,
                              height: Math.max(barHeight, 0),
                              backgroundColor:
                                isSelected || isMax
                                  ? APP_COLOR.ORANGE
                                  : "#FFCCBC",
                              borderTopLeftRadius: 4,
                              borderTopRightRadius: 4,
                              marginBottom: 0,
                              position: "relative",
                            }}
                          >
                            {isSelected && (
                              <View style={styles.tooltip}>
                                <Text style={styles.tooltipText}>
                                  {d.value.toLocaleString("vi-VN")}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View
                            style={{
                              height: X_AXIS_HEIGHT,
                              justifyContent: "center",
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <Text style={{ fontSize: 10, color: "#999" }}>
                              {d.label}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* Details Section */}
            <View style={styles.detailsSection}>
              <View style={styles.detailsHeader}>
                <Text style={styles.sectionTitle}>Chi tiết</Text>
                {/* <TouchableOpacity><Text style={styles.seeAll}>Xem tất cả &gt;</Text></TouchableOpacity> */}
              </View>

              {displayData.list.length > 0 ? (
                displayData.list.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() =>
                      router.push(`/(tabs)/groups/expense/${item.expense.id}`)
                    }
                  >
                    <View style={styles.itemIconBg}>
                      <Ionicons
                        name="cart-outline"
                        size={24}
                        color={APP_COLOR.ORANGE}
                      />
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.expense.description}
                      </Text>
                      <Text style={styles.itemSub}>
                        {format(
                          parseISO(item.expense.createdTime),
                          "dd/MM/yyyy"
                        )}
                      </Text>
                    </View>
                    <Text style={styles.itemAmount}>
                      -{item.shareAmount.toLocaleString("vi-VN")} đ
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>Không có dữ liệu chi tiêu.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Absolute Dropdown Overlay */}
      {showDropdown && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          >
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.1)" }} />
          </TouchableOpacity>
          <View
            style={[
              styles.dropdownMenu,
              { position: "absolute", top: 60, left: 20, zIndex: 100 },
            ]}
          >
            {(["day", "week", "month"] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.dropdownItem,
                  viewMode === mode && styles.activeDropdownItem,
                ]}
                onPress={() => {
                  setViewMode(mode);
                  setShowDropdown(false);
                  setCurrentDate(new Date());
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    viewMode === mode && styles.activeDropdownItemText,
                  ]}
                >
                  {viewModeLabels[mode]}
                </Text>
                {viewMode === mode && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={APP_COLOR.ORANGE}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    zIndex: 10,
    elevation: 10,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  dropdownText: {
    fontWeight: "600",
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-start",
    paddingTop: 120, // Adjust based on header height
    paddingLeft: 20,
  },
  dropdownMenu: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 5,
    width: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  activeDropdownItem: {
    backgroundColor: "#FFF3E0",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  activeDropdownItemText: {
    color: APP_COLOR.ORANGE,
    fontWeight: "600",
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  navBtn: {
    padding: 5,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  cardsContainer: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 25,
  },
  card: {
    flex: 1,
    padding: 15,
    borderRadius: 16,
    minHeight: 100,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activeCard: {
    backgroundColor: APP_COLOR.ORANGE,
  },
  inactiveCard: {
    backgroundColor: "white",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  activeIndicator: {
    width: 30,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 2,
    marginTop: 10,
  },
  chartSection: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  tooltip: {
    position: "absolute",
    top: -35,
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 100,
    minWidth: 80,
    left: -30, // Center relative to 20px bar: (80-20)/2 * -1 = -30
    alignItems: "center",
    justifyContent: "center",
  },
  tooltipText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAll: {
    color: APP_COLOR.ORANGE,
    fontWeight: "600",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  itemIconBg: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 12,
    color: "#999",
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default StatisticsScreen;
