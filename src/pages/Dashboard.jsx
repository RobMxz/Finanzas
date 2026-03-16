import {
  Box,
  Flex,
  Text,
  Heading,
  HStack,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdAccountBalance,
  MdSavings,
  MdWarning,
} from "react-icons/md";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { NavLink } from "react-router-dom";
import { useColorTheme } from "../hooks/useColorTheme";
import { useTransactions } from "../hooks/useTransactions";
import { useSavings } from "../hooks/useSavings";
import { useBudgets } from "../hooks/useBudgets";
import useAppStore from "../store/useAppStore";
import React from "react";

const formatPEN = (n) =>
  `S/ ${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

const formatFecha = (f) =>
  new Date(f + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const MESES_CORTO = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const SALUDOS = ["Buenos días", "Buenas tardes", "Buenas noches"];

const saludo = () => {
  const h = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Lima" }),
  ).getHours();
  if (h >= 5 && h < 12) return SALUDOS[0];
  if (h >= 12 && h < 20) return SALUDOS[1];
  return SALUDOS[2];
};

// ── Tarjeta stat ─────────────────────────────────────
function StatCard({ label, valor, color, icon: Icon, subcaption, trend }) {
  const c = useColorTheme();
  return (
    <Box
      flex={1}
      minW={{ base: "calc(50% - 6px)", md: "0" }}
      bg={c.bgCard}
      border="1px solid"
      borderColor={c.borderColor}
      borderRadius="xl"
      p={{ base: 3, md: 4 }}
      position="relative"
      overflow="hidden"
    >
      {/* Fondo decorativo */}
      <Box
        position="absolute"
        top="-10px"
        right="-10px"
        w="70px"
        h="70px"
        borderRadius="full"
        bg={color}
        opacity={0.07}
      />
      <Flex justify="space-between" align="flex-start" mb={2}>
        <Text fontSize="xs" color={c.textSecondary} fontWeight="medium">
          {label}
        </Text>
        <Box bg={`${color}20`} p={1.5} borderRadius="lg" color={color}>
          <Icon size={16} />
        </Box>
      </Flex>
      <Text
        fontSize={{ base: "lg", md: "xl" }}
        fontWeight="bold"
        color={color}
        mb={0.5}
      >
        {valor}
      </Text>
      {subcaption && (
        <Text fontSize="xs" color={c.textMuted}>
          {subcaption}
        </Text>
      )}
    </Box>
  );
}

// ── Tooltip personalizado ────────────────────────────
function CustomTooltip({ active, payload, label }) {
  const c = useColorTheme();
  if (!active || !payload?.length) return null;
  return (
    <Box
      bg={c.bgCard}
      border="1px solid"
      borderColor={c.borderColor}
      borderRadius="lg"
      px={3}
      py={2}
      boxShadow="md"
    >
      <Text fontSize="xs" color={c.textSecondary} mb={1}>
        {label}
      </Text>
      {payload.map((p, i) => (
        <Text key={i} fontSize="sm" fontWeight="semibold" color={p.color}>
          {p.name}: {formatPEN(p.value)}
        </Text>
      ))}
    </Box>
  );
}

export default function Dashboard() {
  const c = useColorTheme();
  const user = useAppStore((s) => s.user);

  const { transactions, loading: loadingTx } = useTransactions();
  const { goals, loading: loadingGoals } = useSavings();
  const { budgets, loading: loadingBudgets, fetchBudgets } = useBudgets();

  const hoy = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Lima" }),
  );
  const mes = hoy.getMonth() + 1;
  const año = hoy.getFullYear();

  // Cargar presupuestos del mes actual
  const [budgetsCargados, setBudgetsCargados] = React.useState(false);
  React.useEffect(() => {
    if (!budgetsCargados) {
      fetchBudgets(mes, año);
      setBudgetsCargados(true);
    }
  }, []);

  const nombre =
    user?.user_metadata?.nombre || user?.email?.split("@")[0] || "usuario";

  // ── Transacciones del mes ─────────────────────────
  const txMes = transactions.filter((t) => {
    const f = new Date(t.fecha + "T00:00:00");
    return f.getMonth() + 1 === mes && f.getFullYear() === año;
  });

  const ingresosMes = txMes
    .filter((t) => t.tipo === "ingreso")
    .reduce((acc, t) => acc + Number(t.monto), 0);
  const gastosMes = txMes
    .filter((t) => t.tipo === "gasto")
    .reduce((acc, t) => acc + Number(t.monto), 0);
  const balance = ingresosMes - gastosMes;

  // ── Últimas 5 transacciones ───────────────────────
  const ultimasTx = transactions.slice(0, 5);

  // ── Gastos por categoría ──────────────────────────
  const gastosPorCategoria = txMes
    .filter((t) => t.tipo === "gasto")
    .reduce((acc, t) => {
      const nombre = t.category?.nombre || "Otros";
      const color = t.category?.color || "#6366f1";
      const ex = acc.find((a) => a.nombre === nombre);
      if (ex) ex.valor += Number(t.monto);
      else acc.push({ nombre, valor: Number(t.monto), color });
      return acc;
    }, [])
    .sort((a, b) => b.valor - a.valor);

  // ── Evolución 6 meses ─────────────────────────────
  const evolucion = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(año, mes - 6 + i, 1);
    const m = d.getMonth() + 1;
    const a = d.getFullYear();
    const txDelMes = transactions.filter((t) => {
      const f = new Date(t.fecha + "T00:00:00");
      return f.getMonth() + 1 === m && f.getFullYear() === a;
    });
    return {
      mes: MESES_CORTO[m - 1],
      Ingresos: txDelMes
        .filter((t) => t.tipo === "ingreso")
        .reduce((s, t) => s + Number(t.monto), 0),
      Gastos: txDelMes
        .filter((t) => t.tipo === "gasto")
        .reduce((s, t) => s + Number(t.monto), 0),
    };
  });

  // ── Presupuestos con estado ───────────────────────
  const presupuestosEnRiesgo = budgets.filter((b) => {
    const pct = b.monto_limite > 0 ? (b.gastado / b.monto_limite) * 100 : 0;
    return pct >= 80;
  });

  // ── Metas en progreso ─────────────────────────────
  const metasEnProgreso = goals.filter((g) => !g.completada).slice(0, 3);

  const loading = loadingTx || loadingGoals;

  if (loading)
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner color="green.500" size="xl" />
      </Flex>
    );

  return (
    <Box>
      {/* ── Saludo ── */}
      <Box mb={5}>
        <Heading size={{ base: "md", md: "lg" }} color={c.textPrimary}>
          {saludo()}, {nombre} 👋
        </Heading>
        <Text fontSize="sm" color={c.textSecondary} mt={0.5}>
          {MESES[mes - 1]} {año} · aquí está el resumen de tu mes
        </Text>
      </Box>

      {/* ── Alertas de presupuesto en riesgo ── */}
      {presupuestosEnRiesgo.length > 0 && (
        <Box
          bg="orange.50"
          border="1px solid"
          borderColor="orange.200"
          borderRadius="xl"
          p={4}
          mb={5}
        >
          <HStack gap={2} mb={2}>
            <Box color="orange.500">
              <MdWarning size={18} />
            </Box>
            <Text fontSize="sm" fontWeight="semibold" color="orange.700">
              {presupuestosEnRiesgo.length === 1
                ? "1 presupuesto en riesgo este mes"
                : `${presupuestosEnRiesgo.length} presupuestos en riesgo este mes`}
            </Text>
          </HStack>
          <VStack gap={1.5} align="stretch">
            {presupuestosEnRiesgo.map((b) => {
              const pct = Math.round((b.gastado / b.monto_limite) * 100);
              const superado = b.gastado > b.monto_limite;
              return (
                <Flex
                  key={b.id}
                  justify="space-between"
                  align="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <HStack gap={2}>
                    <Text fontSize="sm">{b.category?.icono}</Text>
                    <Text fontSize="sm" color="orange.700">
                      {b.category?.nombre}
                    </Text>
                  </HStack>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color={superado ? "red.600" : "orange.600"}
                  >
                    {superado ? `⚠️ Superado (${pct}%)` : `⚡ ${pct}% usado`} ·{" "}
                    {formatPEN(b.gastado)} / {formatPEN(b.monto_limite)}
                  </Text>
                </Flex>
              );
            })}
          </VStack>
          <NavLink to="/presupuestos">
            <Text fontSize="xs" color="orange.600" fontWeight="medium" mt={2}>
              Ver presupuestos →
            </Text>
          </NavLink>
        </Box>
      )}

      {/* ── Stat cards ── */}
      <Flex gap={3} mb={5} flexWrap="wrap">
        <StatCard
          label="Ingresos del mes"
          valor={formatPEN(ingresosMes)}
          color="green.500"
          icon={MdTrendingUp}
        />
        <StatCard
          label="Gastos del mes"
          valor={formatPEN(gastosMes)}
          color="red.500"
          icon={MdTrendingDown}
        />
        <StatCard
          label="Balance"
          valor={formatPEN(balance)}
          color={balance >= 0 ? "green.500" : "red.500"}
          icon={MdAccountBalance}
          subcaption={
            balance >= 0 ? "¡Vas bien! 👍" : "Gastas más de lo que ganas"
          }
        />
        <StatCard
          label="Metas activas"
          valor={`${metasEnProgreso.length}`}
          color="blue.500"
          icon={MdSavings}
          subcaption={`${goals.filter((g) => g.completada).length} completadas`}
        />
      </Flex>

      {/* ── Fila: Pie + Últimas transacciones ── */}
      <Flex gap={4} mb={4} direction={{ base: "column", lg: "row" }}>
        {/* Gastos por categoría */}
        <Box
          flex={1}
          bg={c.bgCard}
          border="1px solid"
          borderColor={c.borderColor}
          borderRadius="xl"
          p={{ base: 4, md: 5 }}
        >
          <Text
            fontWeight="semibold"
            fontSize="sm"
            color={c.textPrimary}
            mb={4}
          >
            Gastos por categoría — {MESES[mes - 1]}
          </Text>
          {gastosPorCategoria.length === 0 ? (
            <Flex
              justify="center"
              align="center"
              h="180px"
              direction="column"
              gap={2}
            >
              <Text fontSize="2xl">📊</Text>
              <Text fontSize="sm" color={c.textSecondary}>
                Sin gastos este mes
              </Text>
            </Flex>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={gastosPorCategoria}
                    dataKey="valor"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {gastosPorCategoria.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatPEN(v)}
                    contentStyle={{
                      background: c.bgCard,
                      border: `1px solid ${c.borderColor}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <VStack gap={1.5} align="stretch" mt={2}>
                {gastosPorCategoria.slice(0, 5).map((item, i) => (
                  <Flex key={i} justify="space-between" align="center">
                    <HStack gap={2}>
                      <Box
                        w="10px"
                        h="10px"
                        borderRadius="full"
                        bg={item.color}
                        flexShrink={0}
                      />
                      <Text
                        fontSize="xs"
                        color={c.textSecondary}
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        maxW="140px"
                      >
                        {item.nombre}
                      </Text>
                    </HStack>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color={c.textPrimary}
                    >
                      {formatPEN(item.valor)}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            </>
          )}
        </Box>

        {/* Últimas transacciones */}
        <Box
          flex={1}
          bg={c.bgCard}
          border="1px solid"
          borderColor={c.borderColor}
          borderRadius="xl"
          p={{ base: 4, md: 5 }}
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="semibold" fontSize="sm" color={c.textPrimary}>
              Últimas transacciones
            </Text>
            <NavLink to="/transacciones">
              <Text
                fontSize="xs"
                color="green.500"
                fontWeight="medium"
                _hover={{ textDecoration: "underline" }}
              >
                Ver todas →
              </Text>
            </NavLink>
          </Flex>
          {ultimasTx.length === 0 ? (
            <Flex
              justify="center"
              align="center"
              h="180px"
              direction="column"
              gap={2}
            >
              <Text fontSize="2xl">📭</Text>
              <Text fontSize="sm" color={c.textSecondary}>
                Sin transacciones aún
              </Text>
            </Flex>
          ) : (
            <VStack gap={0} align="stretch">
              {ultimasTx.map((t, i) => (
                <Flex
                  key={t.id}
                  align="center"
                  gap={3}
                  py={3}
                  borderTop={i > 0 ? "1px solid" : "none"}
                  borderColor={c.borderColor}
                >
                  <Flex
                    w="34px"
                    h="34px"
                    borderRadius="lg"
                    flexShrink={0}
                    align="center"
                    justify="center"
                    bg={t.tipo === "ingreso" ? "green.50" : "red.50"}
                    fontSize="md"
                  >
                    {t.category?.icono || "💰"}
                  </Flex>
                  <Box flex={1} minW={0}>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      color={c.textPrimary}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {t.category?.nombre || "Sin categoría"}
                    </Text>
                    <Text fontSize="xs" color={c.textMuted}>
                      {formatFecha(t.fecha)}
                    </Text>
                  </Box>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    flexShrink={0}
                    color={t.tipo === "ingreso" ? "green.500" : "red.500"}
                  >
                    {t.tipo === "ingreso" ? "+" : "-"}
                    {formatPEN(t.monto)}
                  </Text>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      </Flex>

      {/* ── Evolución 6 meses ── */}
      <Box
        bg={c.bgCard}
        border="1px solid"
        borderColor={c.borderColor}
        borderRadius="xl"
        p={{ base: 4, md: 5 }}
        mb={4}
      >
        <Text fontWeight="semibold" fontSize="sm" color={c.textPrimary} mb={4}>
          Evolución últimos 6 meses
        </Text>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={evolucion}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={c.isDark ? "#334155" : "#f1f5f9"}
            />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: c.textSecondary }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: c.textSecondary }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `S/${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: c.textSecondary }} />
            <Line
              type="monotone"
              dataKey="Ingresos"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#22c55e" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Gastos"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#ef4444" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* ── Fila: Presupuestos + Metas ── */}
      <Flex gap={4} direction={{ base: "column", lg: "row" }}>
        {/* Resumen presupuestos */}
        <Box
          flex={1}
          bg={c.bgCard}
          border="1px solid"
          borderColor={c.borderColor}
          borderRadius="xl"
          p={{ base: 4, md: 5 }}
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="semibold" fontSize="sm" color={c.textPrimary}>
              Presupuestos — {MESES[mes - 1]}
            </Text>
            <NavLink to="/presupuestos">
              <Text fontSize="xs" color="green.500" fontWeight="medium">
                Ver todos →
              </Text>
            </NavLink>
          </Flex>
          {budgets.length === 0 ? (
            <Flex
              justify="center"
              align="center"
              h="120px"
              direction="column"
              gap={2}
            >
              <Text fontSize="2xl">🎯</Text>
              <Text fontSize="sm" color={c.textSecondary}>
                Sin presupuestos este mes
              </Text>
            </Flex>
          ) : (
            <VStack gap={3} align="stretch">
              {budgets.slice(0, 4).map((b) => {
                const pct =
                  b.monto_limite > 0
                    ? Math.min((b.gastado / b.monto_limite) * 100, 100)
                    : 0;
                const superado = b.gastado > b.monto_limite;
                const casi = !superado && pct >= 80;
                const barColor = superado
                  ? "red.500"
                  : casi
                    ? "orange.400"
                    : "green.500";
                const bgBar = superado
                  ? "red.100"
                  : casi
                    ? "orange.100"
                    : "green.100";

                return (
                  <Box key={b.id}>
                    <Flex justify="space-between" mb={1}>
                      <HStack gap={1.5}>
                        <Text fontSize="sm">{b.category?.icono}</Text>
                        <Text
                          fontSize="xs"
                          color={c.textPrimary}
                          fontWeight="medium"
                        >
                          {b.category?.nombre}
                        </Text>
                      </HStack>
                      <Text
                        fontSize="xs"
                        color={
                          superado
                            ? "red.500"
                            : casi
                              ? "orange.500"
                              : c.textSecondary
                        }
                      >
                        {Math.round(pct)}% · {formatPEN(b.gastado)} /{" "}
                        {formatPEN(b.monto_limite)}
                      </Text>
                    </Flex>
                    <Box
                      bg={bgBar}
                      borderRadius="full"
                      h="6px"
                      overflow="hidden"
                    >
                      <Box
                        h="full"
                        borderRadius="full"
                        bg={barColor}
                        w={`${pct}%`}
                        transition="width 0.4s ease"
                      />
                    </Box>
                  </Box>
                );
              })}
              {budgets.length > 4 && (
                <Text fontSize="xs" color={c.textMuted} textAlign="center">
                  +{budgets.length - 4} más
                </Text>
              )}
            </VStack>
          )}
        </Box>

        {/* Metas en progreso */}
        <Box
          flex={1}
          bg={c.bgCard}
          border="1px solid"
          borderColor={c.borderColor}
          borderRadius="xl"
          p={{ base: 4, md: 5 }}
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="semibold" fontSize="sm" color={c.textPrimary}>
              Metas en progreso
            </Text>
            <NavLink to="/ahorros">
              <Text fontSize="xs" color="green.500" fontWeight="medium">
                Ver todas →
              </Text>
            </NavLink>
          </Flex>
          {metasEnProgreso.length === 0 ? (
            <Flex
              justify="center"
              align="center"
              h="120px"
              direction="column"
              gap={2}
            >
              <Text fontSize="2xl">🐷</Text>
              <Text fontSize="sm" color={c.textSecondary}>
                Sin metas activas
              </Text>
            </Flex>
          ) : (
            <VStack gap={3} align="stretch">
              {metasEnProgreso.map((g) => {
                const pct =
                  g.monto_objetivo > 0
                    ? Math.min((g.total_aportado / g.monto_objetivo) * 100, 100)
                    : 0;
                return (
                  <Box key={g.id}>
                    <Flex justify="space-between" mb={1}>
                      <Text
                        fontSize="xs"
                        color={c.textPrimary}
                        fontWeight="medium"
                      >
                        {g.nombre}
                      </Text>
                      <Text fontSize="xs" color={c.textSecondary}>
                        {Math.round(pct)}% · {formatPEN(g.total_aportado)} /{" "}
                        {formatPEN(g.monto_objetivo)}
                      </Text>
                    </Flex>
                    <Box
                      bg={c.bgHover}
                      borderRadius="full"
                      h="6px"
                      overflow="hidden"
                    >
                      <Box
                        h="full"
                        borderRadius="full"
                        bg="blue.400"
                        w={`${pct}%`}
                        transition="width 0.4s ease"
                      />
                    </Box>
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
