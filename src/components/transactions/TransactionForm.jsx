import { useState } from "react";
import { Box, Input, Text, VStack, HStack, Textarea } from "@chakra-ui/react";
import AppButton from "../ui/AppButton";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useBudgets } from "../../hooks/useBudgets";

const formatPEN = (n) =>
  `S/ ${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

export default function TransactionForm({
  onSubmit,
  onCancel,
  initial = null,
  hoy,
}) {
  const c = useColorTheme();
  const { verificarPresupuesto } = useBudgets();

  const [tipo, setTipo] = useState(initial?.tipo || "gasto");
  const [monto, setMonto] = useState(initial?.monto || "");
  const [categoryId, setCategoryId] = useState(initial?.category_id || "");
  const [fecha, setFecha] = useState(initial?.fecha || hoy);
  const [descripcion, setDescripcion] = useState(initial?.descripcion || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Warning de presupuesto
  const [budgetWarning, setBudgetWarning] = useState(null); // null | objeto
  const [confirmando, setConfirmando] = useState(false);

  const categoriasFiltradas = (onSubmit.categories || []).filter(
    (cat) => cat.tipo === tipo,
  );

  // Verificar presupuesto al cambiar categoría, monto o fecha
  const checkBudget = async (catId, montoVal, fechaVal) => {
    if (tipo !== "gasto" || !catId || !montoVal || !fechaVal) {
      setBudgetWarning(null);
      return;
    }
    const warning = await verificarPresupuesto(
      catId,
      Number(montoVal),
      fechaVal,
    );
    setBudgetWarning(warning);
  };

  const handleCategoryChange = async (val) => {
    setCategoryId(val);
    setConfirmando(false);
    await checkBudget(val, monto, fecha);
  };

  const handleMontoChange = async (val) => {
    setMonto(val);
    setConfirmando(false);
    await checkBudget(categoryId, val, fecha);
  };

  const handleFechaChange = async (val) => {
    setFecha(val);
    setConfirmando(false);
    await checkBudget(categoryId, monto, val);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!monto || isNaN(monto) || Number(monto) <= 0) {
      setError("Ingresa un monto válido mayor a 0.");
      return;
    }
    if (!categoryId) {
      setError("Selecciona una categoría.");
      return;
    }
    if (!fecha) {
      setError("Selecciona una fecha.");
      return;
    }

    // Si hay warning de presupuesto superado y no ha confirmado, pedir confirmación
    if (budgetWarning?.tipo === "superado" && !confirmando) {
      setConfirmando(true);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        tipo,
        monto: Number(monto),
        category_id: categoryId,
        fecha,
        descripcion: descripcion || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setConfirmando(false);
    }
  };

  const inputStyle = {
    bg: c.bgInput,
    borderColor: c.borderColor,
    color: c.textPrimary,
    borderRadius: "lg",
  };

  return (
    <VStack gap={4} align="stretch">
      {/* Tipo */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" color={c.textPrimary} mb={2}>
          Tipo
        </Text>
        <HStack gap={2}>
          {["gasto", "ingreso"].map((t) => (
            <AppButton
              key={t}
              flex={1}
              size="sm"
              variant={tipo === t ? "solid" : "outline"}
              colorPalette={t === "ingreso" ? "green" : "red"}
              onClick={() => {
                setTipo(t);
                setCategoryId("");
                setBudgetWarning(null);
                setConfirmando(false);
              }}
            >
              {t === "ingreso" ? "Ingreso" : "Gasto"}
            </AppButton>
          ))}
        </HStack>
      </Box>

      {/* Monto */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" color={c.textPrimary} mb={2}>
          Monto (S/)
        </Text>
        <Input
          type="number"
          placeholder="0.00"
          value={monto}
          onChange={(e) => handleMontoChange(e.target.value)}
          {...inputStyle}
        />
      </Box>

      {/* Categoría */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" color={c.textPrimary} mb={2}>
          Categoría
        </Text>
        <Box
          as="select"
          value={categoryId}
          onChange={(e) => handleCategoryChange(e.target.value)}
          w="full"
          px={3}
          py={2}
          borderRadius="lg"
          border="1px solid"
          fontSize="sm"
          bg={c.bgInput}
          borderColor={c.borderColor}
          color={categoryId ? c.textPrimary : c.textMuted}
        >
          <option value="">Seleccionar categoría...</option>
          {categoriasFiltradas.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icono} {cat.nombre}
            </option>
          ))}
        </Box>
      </Box>

      {/* Fecha */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" color={c.textPrimary} mb={2}>
          Fecha
        </Text>
        <Input
          type="date"
          value={fecha}
          max={hoy}
          onChange={(e) => handleFechaChange(e.target.value)}
          {...inputStyle}
        />
      </Box>

      {/* Descripción */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" color={c.textPrimary} mb={2}>
          Descripción{" "}
          <Text as="span" color={c.textMuted} fontWeight="normal">
            (opcional)
          </Text>
        </Text>
        <Textarea
          placeholder="Ej: Almuerzo en restaurante..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          resize="none"
          {...inputStyle}
        />
      </Box>

      {/* ── Warning de presupuesto ── */}
      {budgetWarning && tipo === "gasto" && (
        <Box
          border="1px solid"
          borderColor={
            budgetWarning.tipo === "superado" ? "red.300" : "orange.300"
          }
          bg={budgetWarning.tipo === "superado" ? "red.50" : "orange.50"}
          borderRadius="lg"
          p={3}
        >
          {budgetWarning.tipo === "superado" ? (
            <VStack align="stretch" gap={1}>
              <Text fontSize="sm" fontWeight="semibold" color="red.600">
                ⚠️ Superarás tu presupuesto
              </Text>
              <Text fontSize="xs" color="red.500">
                Límite: {formatPEN(budgetWarning.limite)} · Ya gastado:{" "}
                {formatPEN(budgetWarning.gastoActual)} · Con este gasto:{" "}
                {formatPEN(budgetWarning.gastoNuevo)}
              </Text>
              <Text fontSize="xs" color="red.600" fontWeight="medium">
                Exceso: {formatPEN(budgetWarning.exceso)}
              </Text>
            </VStack>
          ) : (
            <VStack align="stretch" gap={1}>
              <Text fontSize="sm" fontWeight="semibold" color="orange.600">
                ⚡ Llevarás el {budgetWarning.porcentaje}% de tu presupuesto
              </Text>
              <Text fontSize="xs" color="orange.500">
                Límite: {formatPEN(budgetWarning.limite)} · Con este gasto:{" "}
                {formatPEN(budgetWarning.gastoNuevo)}
              </Text>
            </VStack>
          )}
        </Box>
      )}

      {/* Error */}
      {error && (
        <Box
          bg="red.50"
          border="1px solid"
          borderColor="red.200"
          borderRadius="lg"
          p={3}
        >
          <Text fontSize="sm" color="red.600">
            ⚠️ {error}
          </Text>
        </Box>
      )}

      {/* ── Botones ── */}
      {confirmando ? (
        // Pide confirmación si supera presupuesto
        <VStack gap={2} align="stretch">
          <Text
            fontSize="sm"
            textAlign="center"
            color="red.600"
            fontWeight="medium"
          >
            ¿Deseas registrar el gasto de todas formas?
          </Text>
          <HStack gap={3}>
            <AppButton
              flex={1}
              variant="outline"
              borderColor={c.borderColor}
              color={c.textSecondary}
              onClick={() => setConfirmando(false)}
            >
              Cancelar
            </AppButton>
            <AppButton
              flex={1}
              colorPalette="red"
              loading={loading}
              loadingText="Guardando..."
              onClick={async () => {
                setLoading(true);
                try {
                  await onSubmit({
                    tipo,
                    monto: Number(monto),
                    category_id: categoryId,
                    fecha,
                    descripcion: descripcion || null,
                  });
                } catch (err) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                  setConfirmando(false);
                }
              }}
            >
              Sí, registrar igual
            </AppButton>
          </HStack>
        </VStack>
      ) : (
        <HStack gap={3} pt={1}>
          <AppButton
            flex={1}
            variant="outline"
            borderColor={c.borderColor}
            color={c.textSecondary}
            onClick={onCancel}
          >
            Cancelar
          </AppButton>
          <AppButton
            flex={1}
            colorPalette="green"
            loading={loading}
            loadingText="Guardando..."
            onClick={handleSubmit}
          >
            {initial ? "Guardar cambios" : "Agregar"}
          </AppButton>
        </HStack>
      )}
    </VStack>
  );
}
