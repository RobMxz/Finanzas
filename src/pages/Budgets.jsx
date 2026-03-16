import { useState, useEffect } from "react";
import { useBreakpointValue } from "@chakra-ui/react";
import {
  Box,
  Flex,
  Text,
  Heading,
  HStack,
  VStack,
  Input,
  Spinner,
} from "@chakra-ui/react";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";
import AppButton from "../components/ui/AppButton";
import { useColorTheme } from "../hooks/useColorTheme";
import { useBudgets } from "../hooks/useBudgets";
import { useCategories } from "../hooks/useCategories";
import { useToast } from "../components/ui/Toast";

const formatPEN = (n) =>
  `S/ ${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

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

export default function Budgets() {
  const esMobile = useBreakpointValue({ base: true, md: false });
  const c = useColorTheme();
  const toast = useToast();
  const {
    budgets,
    loading,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useBudgets();
  const { categories } = useCategories();

  const hoy = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Lima" }),
  );
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [año, setAño] = useState(hoy.getFullYear());

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [categoryId, setCategoryId] = useState("");
  const [montoLimite, setMontoLimite] = useState("");
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchBudgets(mes, año);
  }, [mes, año]);

  const mesPrevio = () => {
    if (mes === 1) {
      setMes(12);
      setAño((a) => a - 1);
    } else setMes((m) => m - 1);
  };

  const mesSiguiente = () => {
    const esHoy = mes === hoy.getMonth() + 1 && año === hoy.getFullYear();
    if (esHoy) return;
    if (mes === 12) {
      setMes(1);
      setAño((a) => a + 1);
    } else setMes((m) => m + 1);
  };

  const esMesActual = mes === hoy.getMonth() + 1 && año === hoy.getFullYear();

  const categoriasSinPresupuesto = categories.filter(
    (cat) =>
      cat.tipo === "gasto" && !budgets.find((b) => b.category_id === cat.id),
  );

  const abrirFormNuevo = () => {
    setEditItem(null);
    setCategoryId("");
    setMontoLimite("");
    setFormError(null);
    setShowForm(true);
  };

  const abrirFormEditar = (b) => {
    setEditItem(b);
    setCategoryId(b.category_id);
    setMontoLimite(b.monto_limite);
    setFormError(null);
    setShowForm(true);
  };

  const cerrarForm = () => {
    setShowForm(false);
    setEditItem(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!categoryId && !editItem) {
      setFormError("Selecciona una categoría.");
      return;
    }
    if (!montoLimite || isNaN(montoLimite) || Number(montoLimite) <= 0) {
      setFormError("Ingresa un monto límite válido.");
      return;
    }
    setFormLoading(true);
    try {
      if (editItem) {
        await updateBudget(
          editItem.id,
          { monto_limite: Number(montoLimite) },
          mes,
          año,
        );
        toast.success("Presupuesto actualizado correctamente", "¡Listo!");
      } else {
        await createBudget(
          { category_id: categoryId, monto_limite: Number(montoLimite) },
          mes,
          año,
        );
        toast.success("Presupuesto creado correctamente", "¡Listo!");
      }
      cerrarForm();
    } catch (err) {
      setFormError(err.message);
      toast.error(err.message, "Error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteBudget(id, mes, año);
      toast.success("Presupuesto eliminado");
    } catch (err) {
      toast.error(err.message, "Error");
    } finally {
      setDeletingId(null);
    }
  };

  const totalLimite = budgets.reduce(
    (acc, b) => acc + Number(b.monto_limite),
    0,
  );
  const totalGastado = budgets.reduce(
    (acc, b) => acc + Number(b.gastado || 0),
    0,
  );

  return (
    <Box>
      {/* ── Header ── */}
      <Flex justify="space-between" align="center" mb={4} gap={3}>
        <Box>
          <Heading size={{ base: "md", md: "lg" }} color={c.textPrimary}>
            Presupuestos
          </Heading>
          <Text
            fontSize="sm"
            color={c.textSecondary}
            mt={0.5}
            display={{ base: "none", md: "block" }}
          >
            Control de gastos por categoría
          </Text>
        </Box>
        <AppButton
          colorPalette="green"
          size="sm"
          onClick={abrirFormNuevo}
          leftIcon={<MdAdd size={16} />}
        >
          <Box display={{ base: "none", md: "block" }}>Nuevo presupuesto</Box>
        </AppButton>
      </Flex>

      {/* ── Navegador de mes ── */}
      <Flex
        align="center"
        justify="space-between"
        bg={c.bgCard}
        border="1px solid"
        borderColor={c.borderColor}
        borderRadius="xl"
        px={4}
        py={3}
        mb={4}
        boxShadow={c.shadow}
      >
        <AppButton
          variant="ghost"
          size="sm"
          p={1}
          color={c.textMuted}
          _hover={{ bg: c.bgHover, color: c.textPrimary }}
          onClick={mesPrevio}
        >
          <MdChevronLeft size={22} />
        </AppButton>
        <VStack gap={0}>
          <Text fontWeight="bold" fontSize="lg" color={c.textPrimary}>
            {MESES[mes - 1]} {año}
          </Text>
          {esMesActual && (
            <Text fontSize="xs" color="green.500" fontWeight="600">
              Mes actual
            </Text>
          )}
        </VStack>
        <AppButton
          variant="ghost"
          size="sm"
          p={1}
          color={esMesActual ? c.textMuted : c.textPrimary}
          opacity={esMesActual ? 0.3 : 1}
          _hover={{ bg: esMesActual ? "transparent" : c.bgHover }}
          onClick={mesSiguiente}
          disabled={esMesActual}
        >
          <MdChevronRight size={22} />
        </AppButton>
      </Flex>

      {/* ── Resumen ── */}
      <Box mb={4} w="full">
        <Flex direction="row" gap={3} mb={3} w="full">
          <Box
            style={{ flex: 1, minWidth: 0 }}
            bg={c.bgCard}
            border="1px solid"
            borderColor={c.borderColor}
            borderRadius="xl"
            p={3}
            boxShadow={c.shadow}
          >
            <Text fontSize="xs" color={c.textSecondary} mb={1}>
              Presupuestado
            </Text>
            <Text fontSize="md" fontWeight="bold" color={c.textPrimary}>
              {formatPEN(totalLimite)}
            </Text>
          </Box>
          <Box
            style={{ flex: 1, minWidth: 0 }}
            bg={c.bgCard}
            border="1px solid"
            borderColor={c.borderColor}
            borderRadius="xl"
            p={3}
            boxShadow={c.shadow}
          >
            <Text fontSize="xs" color={c.textSecondary} mb={1}>
              Gastado
            </Text>
            <Text fontSize="md" fontWeight="bold" color="red.500">
              {formatPEN(totalGastado)}
            </Text>
          </Box>
        </Flex>
        <Box
          w="full"
          bg={c.bgCard}
          border="1px solid"
          borderColor={c.borderColor}
          borderRadius="xl"
          p={3}
          boxShadow={c.shadow}
        >
          <Text fontSize="xs" color={c.textSecondary} mb={1}>
            Disponible
          </Text>
          <Text
            fontSize="md"
            fontWeight="bold"
            color={totalLimite - totalGastado >= 0 ? "green.500" : "red.500"}
          >
            {formatPEN(totalLimite - totalGastado)}
          </Text>
        </Box>
      </Box>

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
            maxW={{ base: "100%", md: "440px" }}
            mb={{ base: "65px", md: 0 }}
            maxH={{ base: "calc(92vh - 65px)", md: "85vh" }}
            overflowY="auto"
            boxShadow={c.shadowLg}
            onClick={(e) => e.stopPropagation()}
            className="animate-scaleIn"
          >
            <Flex justify="space-between" align="center" mb={5}>
              <Text fontWeight="600" fontSize="lg" color={c.textPrimary}>
                {editItem ? "Editar presupuesto" : "Nuevo presupuesto"}
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

            <VStack gap={4} align="stretch">
              {!editItem && (
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="500"
                    color={c.textPrimary}
                    mb={2}
                  >
                    Categoría
                  </Text>
                  <Box
                    as="select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    w="full"
                    px={3}
                    py={2}
                    borderRadius="10px"
                    border="1px solid"
                    fontSize="sm"
                    bg={c.bgInput}
                    borderColor={c.borderColor}
                    color={categoryId ? c.textPrimary : c.textMuted}
                    fontFamily="'DM Sans', sans-serif"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categoriasSinPresupuesto.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icono} {cat.nombre}
                      </option>
                    ))}
                  </Box>
                  {categoriasSinPresupuesto.length === 0 && (
                    <Text fontSize="xs" color="orange.500" mt={1}>
                      Todas las categorías ya tienen presupuesto este mes.
                    </Text>
                  )}
                </Box>
              )}

              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="500"
                  color={c.textPrimary}
                  mb={2}
                >
                  Monto límite (S/)
                </Text>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={montoLimite}
                  onChange={(e) => setMontoLimite(e.target.value)}
                  bg={c.bgInput}
                  borderColor={c.borderColor}
                  color={c.textPrimary}
                  borderRadius="10px"
                />
              </Box>

              <Box bg={c.bgHover} borderRadius="10px" px={3} py={2}>
                <Text fontSize="sm" color={c.textSecondary}>
                  📅 Aplicará para{" "}
                  <Text as="span" fontWeight="600" color={c.textPrimary}>
                    {MESES[mes - 1]} {año}
                  </Text>
                </Text>
              </Box>

              {formError && (
                <Box
                  bg="red.50"
                  border="1px solid"
                  borderColor="red.200"
                  borderRadius="10px"
                  p={3}
                >
                  <Text fontSize="sm" color="red.600">
                    ⚠️ {formError}
                  </Text>
                </Box>
              )}

              <HStack gap={3} pt={1}>
                <AppButton
                  flex={1}
                  variant="outline"
                  borderColor={c.borderColor}
                  color={c.textSecondary}
                  onClick={cerrarForm}
                >
                  Cancelar
                </AppButton>
                <AppButton
                  flex={1}
                  colorPalette="green"
                  loading={formLoading}
                  loadingText="Guardando..."
                  onClick={handleSubmit}
                >
                  {editItem ? "Guardar cambios" : "Crear presupuesto"}
                </AppButton>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}

      {/* ── Lista ── */}
      {loading ? (
        <Flex justify="center" align="center" py={12}>
          <Spinner color="green.500" />
        </Flex>
      ) : budgets.length === 0 ? (
        <Box
          bg={c.bgCard}
          border="1px solid"
          borderColor={c.borderColor}
          borderRadius="xl"
          py={14}
          boxShadow={c.shadow}
        >
          <VStack gap={3}>
            <Text fontSize="4xl">🎯</Text>
            <Text color={c.textSecondary} fontSize="sm" textAlign="center">
              No hay presupuestos para {MESES[mes - 1]} {año}
            </Text>
            <Text
              fontSize="xs"
              color={c.textMuted}
              textAlign="center"
              maxW="280px"
            >
              Crea presupuestos por categoría para controlar tus gastos
              mensualmente
            </Text>
            <AppButton
              colorPalette="green"
              size="sm"
              mt={1}
              onClick={abrirFormNuevo}
            >
              Crear primer presupuesto
            </AppButton>
          </VStack>
        </Box>
      ) : (
        <VStack gap={3} align="stretch">
          {budgets.map((b, i) => {
            const porcentaje =
              b.monto_limite > 0
                ? Math.min((b.gastado / b.monto_limite) * 100, 100)
                : 0;
            const superado = b.gastado > b.monto_limite;
            const casi = !superado && porcentaje >= 80;
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
              <Box
                key={b.id}
                bg={c.bgCard}
                border="1px solid"
                borderColor={superado ? "red.200" : c.borderColor}
                borderRadius="xl"
                p={{ base: 4, md: 5 }}
                boxShadow={c.shadow}
                className="animate-fadeInUp"
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
                transition="border-color 0.2s"
              >
                <Flex justify="space-between" align="flex-start" mb={3} gap={2}>
                  <HStack gap={3} flex={1} minW={0}>
                    <Flex
                      w="42px"
                      h="42px"
                      borderRadius="12px"
                      flexShrink={0}
                      align="center"
                      justify="center"
                      bg={superado ? "red.50" : c.bgSubtle}
                      fontSize="lg"
                    >
                      {b.category?.icono || "📦"}
                    </Flex>
                    <Box minW={0}>
                      <Text
                        fontWeight="600"
                        fontSize="sm"
                        color={c.textPrimary}
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {b.category?.nombre || "Sin categoría"}
                      </Text>
                      <Text fontSize="xs" color={c.textSecondary}>
                        {formatPEN(b.gastado)} de {formatPEN(b.monto_limite)}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack gap={1.5} flexShrink={0} align="center">
                    <Text
                      fontSize="sm"
                      fontWeight="700"
                      color={
                        superado ? "red.500" : casi ? "orange.500" : "green.500"
                      }
                    >
                      {Math.round(porcentaje)}%
                    </Text>
                    <AppButton
                      variant="ghost"
                      size="sm"
                      p={1}
                      color={c.textMuted}
                      _hover={{ color: "blue.500", bg: "blue.50" }}
                      onClick={() => abrirFormEditar(b)}
                    >
                      <MdEdit size={15} />
                    </AppButton>
                    <AppButton
                      variant="ghost"
                      size="sm"
                      p={1}
                      color={c.textMuted}
                      _hover={{ color: "red.500", bg: "red.50" }}
                      loading={deletingId === b.id}
                      onClick={() => handleDelete(b.id)}
                    >
                      <MdDelete size={15} />
                    </AppButton>
                  </HStack>
                </Flex>

                <Box bg={bgBar} borderRadius="full" h="8px" overflow="hidden">
                  <Box
                    h="full"
                    borderRadius="full"
                    bg={barColor}
                    w={`${porcentaje}%`}
                    transition="width 0.5s cubic-bezier(0.4,0,0.2,1)"
                  />
                </Box>

                {(superado || casi) && (
                  <Text
                    fontSize="xs"
                    mt={2}
                    color={superado ? "red.500" : "orange.500"}
                    fontWeight="500"
                  >
                    {superado
                      ? `⚠️ Superaste el límite por ${formatPEN(b.gastado - b.monto_limite)}`
                      : `⚡ Llevas el ${Math.round(porcentaje)}% del presupuesto`}
                  </Text>
                )}
              </Box>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}
