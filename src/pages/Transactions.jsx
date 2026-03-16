import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  HStack,
  VStack,
  Input,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import { MdAdd, MdEdit, MdDelete, MdFilterList, MdClose } from "react-icons/md";
import AppButton from "../components/ui/AppButton";
import { useColorTheme } from "../hooks/useColorTheme";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import TransactionForm from "../components/transactions/TransactionForm";
import useAppStore from "../store/useAppStore";
import { useToast } from "../components/ui/Toast";

const formatPEN = (n) =>
  `S/ ${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

const formatFecha = (f) =>
  new Date(f + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const hoyPeru = () => {
  const ahora = new Date();
  const peru = new Date(
    ahora.toLocaleString("en-US", { timeZone: "America/Lima" }),
  );
  return peru.toISOString().split("T")[0];
};

export default function Transactions() {
  const toast = useToast();
  const c = useColorTheme();
  const {
    transactions,
    loading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchTransactions,
  } = useTransactions();
  const { categories } = useCategories();

  const filtrosGuardados = useAppStore((s) => s.filtrosTransacciones);
  const setFiltrosTransacciones = useAppStore((s) => s.setFiltrosTransacciones);
  const limpiarFiltros = useAppStore((s) => s.limpiarFiltrosTransacciones);

  const [filtroTipo, setFiltroTipo] = useState(filtrosGuardados.tipo);
  const [filtroDesde, setFiltroDesde] = useState(filtrosGuardados.fechaDesde);
  const [filtroHasta, setFiltroHasta] = useState(filtrosGuardados.fechaHasta);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showFiltros, setShowFiltros] = useState(false);

  const hayFiltros = filtroTipo || filtroDesde || filtroHasta;
  const hoy = hoyPeru();

  const totalIngresos = transactions
    .filter((t) => t.tipo === "ingreso")
    .reduce((acc, t) => acc + Number(t.monto), 0);
  const totalGastos = transactions
    .filter((t) => t.tipo === "gasto")
    .reduce((acc, t) => acc + Number(t.monto), 0);

  const handleSubmit = async (datos) => {
    try {
      if (editItem) await updateTransaction(editItem.id, datos);
      else await createTransaction(datos);
      setShowForm(false);
      setEditItem(null);
      toast.success(
        editItem ? "Transacción actualizada" : "Transacción registrada",
        "¡Listo!",
      );
    } catch (err) {
      toast.error(err.message, "Error");
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      toast.success("Transacción eliminada");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFiltrar = () => {
    setFiltrosTransacciones({
      tipo: filtroTipo,
      fechaDesde: filtroDesde,
      fechaHasta: filtroHasta,
    });
    fetchTransactions({
      tipo: filtroTipo || undefined,
      fechaDesde: filtroDesde || undefined,
      fechaHasta: filtroHasta || undefined,
    });
    setShowFiltros(false);
  };

  const handleLimpiarFiltros = () => {
    setFiltroTipo("");
    setFiltroDesde("");
    setFiltroHasta("");
    limpiarFiltros();
    fetchTransactions();
  };

  const abrirFormNuevo = () => {
    setEditItem(null);
    setShowForm(true);
  };
  const abrirFormEditar = (t) => {
    setEditItem(t);
    setShowForm(true);
  };
  const cerrarForm = () => {
    setShowForm(false);
    setEditItem(null);
  };

  return (
    <Box>
      {/* ── Header ── */}
      <Flex justify="space-between" align="center" mb={4} gap={3}>
        <Box>
          <Heading size={{ base: "md", md: "lg" }} color={c.textPrimary}>
            Transacciones
          </Heading>
          <Text
            fontSize="sm"
            color={c.textSecondary}
            mt={0.5}
            display={{ base: "none", md: "block" }}
          >
            Registro de ingresos y gastos
          </Text>
        </Box>
        <HStack gap={2}>
          <AppButton
            variant="outline"
            size="sm"
            borderColor={c.borderColor}
            color={c.textSecondary}
            onClick={() => setShowFiltros(!showFiltros)}
            leftIcon={<MdFilterList size={16} />}
          >
            {/* Texto solo en desktop */}
            <Box display={{ base: "none", md: "block" }}>
              Filtros {hayFiltros ? "●" : ""}
            </Box>
          </AppButton>
          <AppButton
            colorPalette="green"
            size="sm"
            onClick={abrirFormNuevo}
            leftIcon={<MdAdd size={16} />}
          >
            <Box display={{ base: "none", md: "block" }}>Nueva transacción</Box>
          </AppButton>
        </HStack>
      </Flex>

      {/* ── Resumen rápido ── */}
      <Flex gap={3} mb={4} flexWrap={{ base: "wrap", md: "nowrap" }}>
        {[
          { label: "Ingresos", valor: totalIngresos, color: "green.500" },
          { label: "Gastos", valor: totalGastos, color: "red.500" },
          {
            label: "Balance",
            valor: totalIngresos - totalGastos,
            color: totalIngresos - totalGastos >= 0 ? "green.500" : "red.500",
          },
        ].map((item) => (
          <Box
            key={item.label}
            flex={1}
            minW={{ base: "calc(50% - 6px)", md: "0" }}
            bg={c.bgCard}
            border="1px solid"
            borderColor={c.borderColor}
            borderRadius="xl"
            p={{ base: 3, md: 4 }}
          >
            <Text fontSize="xs" color={c.textSecondary} mb={1}>
              {item.label}
            </Text>
            <Text
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="bold"
              color={item.color}
            >
              {formatPEN(item.valor)}
            </Text>
          </Box>
        ))}
      </Flex>

      {/* ── Panel de filtros ── */}
      {showFiltros && (
        <Box
          bg={c.bgCard}
          border="1px solid"
          borderColor={c.borderColor}
          borderRadius="xl"
          p={4}
          mb={4}
        >
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="sm" fontWeight="semibold" color={c.textPrimary}>
              Filtrar transacciones
            </Text>
            <AppButton
              variant="ghost"
              size="sm"
              p={1}
              color={c.textMuted}
              onClick={() => setShowFiltros(false)}
            >
              <MdClose size={16} />
            </AppButton>
          </Flex>

          {/* En móvil: apilados. En desktop: en línea */}
          <Flex
            gap={3}
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "flex-end" }}
          >
            <Box flex={1}>
              <Text fontSize="xs" color={c.textSecondary} mb={1}>
                Tipo
              </Text>
              <Box
                as="select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                w="full"
                px={3}
                py={2}
                borderRadius="lg"
                border="1px solid"
                fontSize="sm"
                bg={c.bgInput}
                borderColor={c.borderColor}
                color={c.textPrimary}
              >
                <option value="">Todos</option>
                <option value="ingreso">Ingresos</option>
                <option value="gasto">Gastos</option>
              </Box>
            </Box>

            <Box flex={1}>
              <Text fontSize="xs" color={c.textSecondary} mb={1}>
                Desde
              </Text>
              <Input
                type="date"
                value={filtroDesde}
                max={filtroHasta || hoy}
                onChange={(e) => {
                  setFiltroDesde(e.target.value);
                  if (filtroHasta && e.target.value > filtroHasta)
                    setFiltroHasta("");
                }}
                size="sm"
                borderRadius="lg"
                w="full"
                bg={c.bgInput}
                borderColor={c.borderColor}
                color={c.textPrimary}
              />
            </Box>

            <Box flex={1}>
              <Text fontSize="xs" color={c.textSecondary} mb={1}>
                Hasta
              </Text>
              <Input
                type="date"
                value={filtroHasta}
                min={filtroDesde || undefined}
                max={hoy}
                onChange={(e) => setFiltroHasta(e.target.value)}
                size="sm"
                borderRadius="lg"
                w="full"
                bg={c.bgInput}
                borderColor={c.borderColor}
                color={c.textPrimary}
              />
            </Box>

            <HStack gap={2} justify={{ base: "stretch", md: "flex-start" }}>
              <AppButton
                flex={{ base: 1, md: "unset" }}
                size="sm"
                colorPalette="green"
                onClick={handleFiltrar}
              >
                Aplicar
              </AppButton>
              {hayFiltros && (
                <AppButton
                  flex={{ base: 1, md: "unset" }}
                  size="sm"
                  variant="outline"
                  borderColor={c.borderColor}
                  color={c.textSecondary}
                  onClick={handleLimpiarFiltros}
                >
                  Limpiar
                </AppButton>
              )}
            </HStack>
          </Flex>
        </Box>
      )}

      {/* ── Modal formulario ── */}
      {showForm && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={200}
          display="flex"
          alignItems={{ base: "flex-end", md: "center" }}
          justifyContent="center"
          px={{ base: 0, md: 4 }}
          onClick={cerrarForm}
          className="animate-fadeIn"
        >
          <Box
            bg={c.bgCard}
            borderRadius={{ base: "2xl 2xl 0 0", md: "xl" }}
            p={{ base: 5, md: 6 }}
            w="full"
            maxW={{ base: "100%", md: "500px" }}
            // ── Clave: en móvil deja espacio para el bottom nav
            mb={{ base: "65px", md: 0 }}
            maxH={{ base: "calc(92vh - 65px)", md: "85vh" }}
            overflowY="auto"
            boxShadow={c.shadowLg}
            onClick={(e) => e.stopPropagation()}
            className="animate-scaleIn"
          >
            <Flex justify="space-between" align="center" mb={5}>
              <Text fontWeight="600" fontSize="lg" color={c.textPrimary}>
                {editItem ? "Editar transacción" : "Nueva transacción"}
              </Text>
              <AppButton
                variant="ghost"
                size="sm"
                p={1}
                color={c.textMuted}
                onClick={cerrarForm}
              >
                <MdClose size={18} />
              </AppButton>
            </Flex>
            <TransactionForm
              onSubmit={Object.assign(handleSubmit, { categories })}
              onCancel={cerrarForm}
              initial={editItem}
              hoy={hoy}
            />
          </Box>
        </Box>
      )}

      {/* ── Lista ── */}
      <Box
        bg={c.bgCard}
        border="1px solid"
        borderColor={c.borderColor}
        borderRadius="xl"
        overflow="hidden"
      >
        {loading ? (
          <Flex justify="center" align="center" py={12}>
            <Spinner color="green.500" />
          </Flex>
        ) : transactions.length === 0 ? (
          <VStack py={12} gap={2} px={4}>
            <Text fontSize="3xl">📭</Text>
            <Text color={c.textSecondary} fontSize="sm" textAlign="center">
              No hay transacciones registradas
            </Text>
            <AppButton
              colorPalette="green"
              size="sm"
              mt={2}
              onClick={abrirFormNuevo}
            >
              Agregar primera transacción
            </AppButton>
          </VStack>
        ) : (
          transactions.map((t, i) => (
            <Flex
              key={t.id}
              px={{ base: 3, md: 5 }}
              py={{ base: 3, md: 4 }}
              align="center"
              justify="space-between"
              borderTop={i > 0 ? "1px solid" : "none"}
              borderColor={c.borderColor}
              _hover={{ bg: c.bgHover }}
              transition="background 0.15s"
              gap={2}
            >
              {/* Ícono + info */}
              <HStack gap={3} flex={1} minW={0}>
                <Flex
                  w={{ base: "36px", md: "40px" }}
                  h={{ base: "36px", md: "40px" }}
                  borderRadius="lg"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  bg={t.tipo === "ingreso" ? "green.50" : "red.50"}
                  fontSize={{ base: "md", md: "lg" }}
                >
                  {t.category?.icono || "💰"}
                </Flex>
                <Box minW={0}>
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
                  <Text
                    fontSize="xs"
                    color={c.textMuted}
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {t.descripcion ? t.descripcion : formatFecha(t.fecha)}
                  </Text>
                </Box>
              </HStack>

              {/* Fecha — solo desktop */}
              <Text
                fontSize="xs"
                color={c.textMuted}
                flexShrink={0}
                display={{ base: "none", md: "block" }}
              >
                {formatFecha(t.fecha)}
              </Text>

              {/* Badge — solo desktop */}
              <Badge
                colorPalette={t.tipo === "ingreso" ? "green" : "red"}
                borderRadius="full"
                px={2}
                flexShrink={0}
                display={{ base: "none", md: "flex" }}
              >
                {t.tipo}
              </Badge>

              {/* Monto */}
              <Text
                fontSize={{ base: "sm", md: "sm" }}
                fontWeight="bold"
                flexShrink={0}
                color={t.tipo === "ingreso" ? "green.500" : "red.500"}
              >
                {t.tipo === "ingreso" ? "+" : "-"}
                {formatPEN(t.monto)}
              </Text>

              {/* Acciones */}
              <HStack gap={1} flexShrink={0}>
                <AppButton
                  variant="ghost"
                  size="sm"
                  p={1}
                  color={c.textMuted}
                  _hover={{ color: "blue.500", bg: "blue.50" }}
                  onClick={() => abrirFormEditar(t)}
                >
                  <MdEdit size={16} />
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="sm"
                  p={1}
                  color={c.textMuted}
                  _hover={{ color: "red.500", bg: "red.50" }}
                  loading={deletingId === t.id}
                  onClick={() => handleDelete(t.id)}
                >
                  <MdDelete size={16} />
                </AppButton>
              </HStack>
            </Flex>
          ))
        )}
      </Box>
    </Box>
  );
}
