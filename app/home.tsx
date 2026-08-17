import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useListCompanies, useGetAccountSheet } from "@/api-client";
import type { AccountSheet, AccountSheetRow, Company } from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { Avatar, ErrorState, formatMoney, Header, LoadingState, SegmentedControl, Screen, GhostButton } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/fonts";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const admin = user?.role === "ADMIN";
  const [section, setSection] = useState(admin ? "All Company" : "Assigned Companies");
  const companies = useListCompanies({ query: { enabled: !!user } });
  const account = useGetAccountSheet(2026, 6, { query: { enabled: admin && section === "Account Sheet" } });
  const data = useMemo<Company[]>(() => {
    const companiesById = new Map((companies.data ?? []).map((item) => [item.id, item]));
    return COMPANY_CATALOG.map((catalog) => companiesById.get(catalog.id) ?? {
      id: catalog.id,
      name: catalog.name,
      logoUrl: null,
      employeeCount: 0,
    });
  }, [companies.data]);

  if (companies.isLoading) return <Screen><Header title="Target Ops" subtitle="Operations workspace" /><LoadingState label="Loading companies..." /></Screen>;
  if (companies.isError) return <Screen><Header title="Target Ops" subtitle="Operations workspace" /><ErrorState message="Unable to load your companies." onRetry={() => void companies.refetch()} /></Screen>;

  return (
    <Screen scroll={false}>
      <Header title="Target Ops" subtitle={admin ? "Admin workspace" : "Supervisor workspace"} action={<Pressable onPress={() => void signOut()} hitSlop={12}><Feather name="log-out" size={20} color={colors.mutedForeground} /></Pressable>} />
      {admin ? <SegmentedControl items={["All Company", "Account Sheet"]} value={section} onChange={setSection} /> : <View style={[styles.assignedBanner, { backgroundColor: colors.secondary }]}><Feather name="map-pin" size={16} color={colors.primary} /><Text style={[styles.assignedText, { color: colors.secondaryForeground }]}>Your operations companies</Text></View>}
      {section === "Account Sheet" && admin ? <AccountSheet data={account.data} loading={account.isLoading} error={account.isError} retry={() => void account.refetch()} /> : (
        <FlatList data={data} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <CompanyCard item={item} onPress={() => router.push(`/company/${item.id}`)} />} showsVerticalScrollIndicator={false} />
      )}
    </Screen>
  );
}

function CompanyCard({ item, onPress }: { item: Company; onPress: () => void }) {
  const colors = useColors();
  const mark = COMPANY_CATALOG.find((company) => company.id === item.id)?.mark ?? item.name;
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${item.name}`} style={({ pressed }) => [styles.companyCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.82 : 1 }]}><View style={[styles.logoTile, { backgroundColor: colors.secondary }]}><Avatar name={mark} uri={item.logoUrl} size={66} /></View><View style={styles.companyInfo}><Text style={[styles.companyName, { color: colors.foreground }]}>{item.name}</Text><View style={styles.cardFooter}><Text style={[styles.employeeCount, { color: colors.mutedForeground }]}>{item.employeeCount} employees</Text><Feather name="arrow-up-right" size={16} color={colors.primary} /></View></View></Pressable>;
}

const COMPANY_CATALOG = [
  { id: "company-isf", name: "INDUSTRIAL SECURITY FORCE", mark: "ISF" },
  { id: "company-tis", name: "TARGET INDUSTRIAL SECURITY", mark: "TIS" },
  { id: "company-tssm", name: "TARGET SECURITY SERVICE&MANPOWER", mark: "TSSM" },
  { id: "company-tisf", name: "TARGET INDUSTRIAL SECURITY FORCE Pvt Ltd", mark: "TISF" },
  { id: "company-ke", name: "KARNIKA ENTERPRISES", mark: "KE" },
] as const;

function AccountSheet({ data, loading, error, retry }: { data?: AccountSheet; loading: boolean; error: boolean; retry: () => void }) {
  const colors = useColors();
  if (loading) return <LoadingState label="Loading June account sheet..." />;
  if (error || !data) return <ErrorState message="Unable to load the account sheet." onRetry={retry} />;
  const columns = ["COMPANY", "BILLING", "RECEIVING", "CASH", "SALARY", "BALANCE", "EXP.", "PROFIT"];
  return <View style={{ flex: 1 }}><View style={styles.sheetHeading}><View><Text style={[styles.sheetTitle, { color: colors.foreground }]}>JUNE 2026</Text><Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>Financial snapshot · admin only</Text></View><View style={[styles.monthBadge, { backgroundColor: colors.accent }]}><Feather name="bar-chart-2" size={15} color={colors.accentForeground} /></View></View><View style={styles.tableWrap}><FlatList horizontal data={data.rows} keyExtractor={(item) => item.companyId} ListHeaderComponent={<View style={styles.tableRow}>{columns.map((column) => <Text key={column} style={[styles.tableHeader, { color: colors.mutedForeground }]}>{column}</Text>)}</View>} ListFooterComponent={<View style={[styles.tableRow, { borderTopColor: colors.primary, borderTopWidth: 1 }]}><Text style={[styles.totalCell, { color: colors.foreground }]}>TOTAL ALL</Text><Text style={[styles.totalCell, { color: colors.primary }]}>{formatMoney(data.totals.totalBilling)}</Text><Text style={[styles.totalCell, { color: colors.foreground }]}>{formatMoney(data.totals.totalReceiving)}</Text><Text style={[styles.totalCell, { color: colors.foreground }]}>{formatMoney(data.totals.cashReceived)}</Text><Text style={[styles.totalCell, { color: colors.foreground }]}>{formatMoney(data.totals.salary)}</Text><Text style={[styles.totalCell, { color: colors.foreground }]}>{formatMoney(data.totals.balance)}</Text><Text style={[styles.totalCell, { color: colors.foreground }]}>{formatMoney(data.totals.expense)}</Text><Text style={[styles.totalCell, { color: colors.primary }]}>{formatMoney(data.totals.profit)}</Text></View>} renderItem={({ item }) => <View style={[styles.tableRow, { borderBottomColor: colors.border }]}><Text numberOfLines={2} style={[styles.tableCell, styles.companyCell, { color: colors.foreground }]}>{item.companyName}</Text><Text style={[styles.tableCell, { color: colors.foreground }]}>{formatMoney(item.totalBilling)}</Text><Text style={[styles.tableCell, { color: colors.foreground }]}>{formatMoney(item.totalReceiving)}</Text><Text style={[styles.tableCell, { color: colors.foreground }]}>{formatMoney(item.cashReceived)}</Text><Text style={[styles.tableCell, { color: colors.foreground }]}>{formatMoney(item.salary)}</Text><Text style={[styles.tableCell, { color: colors.foreground }]}>{formatMoney(item.balance)}</Text><Text style={[styles.tableCell, { color: colors.foreground }]}>{formatMoney(item.expense)}</Text><Text style={[styles.tableCell, { color: colors.primary }]}>{formatMoney(item.profit)}</Text></View>} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} /></View></View>;
}

const styles = StyleSheet.create({
  assignedBanner: { flexDirection: "row", alignItems: "center", gap: 9, padding: 13, borderRadius: 15, marginBottom: 14 },
  assignedText: { ...fonts.semibold, fontSize: 13 },
  list: { gap: 12, paddingBottom: 25 },
  companyCard: { minHeight: 108, borderRadius: 20, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 14 },
  logoTile: { width: 78, height: 78, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  companyInfo: { flex: 1, minWidth: 0 },
  companyName: { ...fonts.bold, fontSize: 14, lineHeight: 19 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  employeeCount: { ...fonts.medium, fontSize: 11 },
  sheetHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  sheetTitle: { ...fonts.bold, fontSize: 20 },
  sheetSubtitle: { ...fonts.regular, fontSize: 12, marginTop: 3 },
  monthBadge: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  tableWrap: { flex: 1, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#233543" },
  tableRow: { flexDirection: "row", alignItems: "center", minHeight: 66, borderBottomColor: "#233543", borderBottomWidth: 1, paddingHorizontal: 12, gap: 0 },
  tableHeader: { ...fonts.bold, width: 105, fontSize: 10 },
  tableCell: { ...fonts.medium, width: 105, fontSize: 12 },
  companyCell: { width: 180 },
  totalCell: { ...fonts.bold, width: 105, fontSize: 12 },
});