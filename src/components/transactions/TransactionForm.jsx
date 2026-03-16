import { useState } from "react";
import {
  Box,
  Input,
  Text,
  VStack,
  HStack,
  Textarea,
  Flex,
} from "@chakra-ui/react";
import { MdAdd, MdDelete } from "react-icons/md";
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

  // ── Ítems de desglose ──────────────────────────────
  const [items, setItems] = useState(
    initial?.items?.map((i) => ({
      nombre: i.nombre,
      cantidad: i.cantidad,
      monto: i.monto,
    })) || [],
  );
  const [showItems, setShowItems] = useState((initial?.items?.length || 0) > 0);

  // Warning presupuesto
  const [budgetWarning, setBudgetWarning] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const categoriasFiltradas = (onSubmit.categories || []).filter(
    (cat) => cat.tipo === tipo,
  );

  // Total de ítems
  const totalItems = items.reduce(
    (acc, item) => acc + Number(item.cantidad) * Number(item.monto),
    0,
  );

  // Sincronizar monto con total de ítems automáticamente
  const sincronizarMonto = (nuevosItems) => {
    const total = nuevosItems.reduce(
      (acc, item) => acc + Number(item.cantidad || 0) * Number(item.monto || 0),
      0,
    );
    if (total > 0) setMonto(total.toFixed(2));
  };

  const agregarItem = () => {
    setItems((prev) => [...prev, { nombre: "", cantidad: 1, monto: "" }]);
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevos = items.map((item, i) =>
      i === index ? { ...item, [campo]: valor } : item,
    );
    setItems(nuevos);
    sincronizarMonto(nuevos);
  };

  const eliminarItem = (index) => {
    const nuevos = items.filter((_, i) => i !== index);
    setItems(nuevos);
    sincronizarMonto(nuevos);
  };

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

  // Validar ítems
  const validarItems = () => {
    for (const item of items) {
      if (!item.nombre.trim()) return "Todos los ítems deben tener un nombre.";
      if (!item.cantidad || Number(item.cantidad) <= 0)
        return "La cantidad debe ser mayor a 0.";
      if (!item.monto || Number(item.monto) <= 0)
        return "El monto por ítem debe ser mayor a 0.";
    }
    return null;
  };

  const doSubmit = async () => {
    setLoading(true);
    try {
      const itemsLimpios = items
        .filter((i) => i.nombre.trim())
        .map((i) => ({
          nombre: i.nombre.trim(),
          cantidad: Number(i.cantidad),
          monto: Number(i.monto),
        }));
      await onSubmit(
        {
          tipo,
          monto: Number(monto),
          category_id: categoryId,
          fecha,
          descripcion: descripcion || null,
        },
        itemsLimpios,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setConfirmando(false);
    }
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
    const itemError = validarItems();
    if (itemError) {
      setError(itemError);
      return;
    }

    if (budgetWarning?.tipo === "superado" && !confirmando) {
      setConfirmando(true);
      return;
    }
    await doSubmit();
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
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" fontWeight="medium" color={c.textPrimary}>
            Monto (S/)
          </Text>
          {showItems && items.length > 0 && totalItems > 0 && (
            <Text fontSize="xs" color={c.textMuted}>
              Total ítems: {formatPEN(totalItems)}
            </Text>
          )}
        </Flex>
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

      {/* ── Desglose de ítems ── */}
      <Box
        border="1px solid"
        borderColor={c.borderColor}
        borderRadius="xl"
        overflow="hidden"
      >
        {/* Header del desglose */}
        <Flex
          px={4}
          py={3}
          justify="space-between"
          align="center"
          bg={c.bgHover}
          cursor="pointer"
          onClick={() => {
            setShowItems(!showItems);
            if (!showItems && items.length === 0) agregarItem();
          }}
        >
          <HStack gap={2}>
            <Text fontSize="sm" fontWeight="500" color={c.textPrimary}>
              🧾 Desglose de ítems
            </Text>
            {items.length > 0 && (
              <Box bg="green.100" px={2} py={0.5} borderRadius="full">
                <Text fontSize="11px" fontWeight="600" color="green.700">
                  {items.length} ítem{items.length > 1 ? "s" : ""}
                </Text>
              </Box>
            )}
          </HStack>
          <Text fontSize="xs" color={c.textSecondary}>
            {showItems ? "▲ Ocultar" : "▼ Agregar desglose (opcional)"}
          </Text>
        </Flex>

        {/* Lista de ítems */}
        {showItems && (
          <Box px={4} py={3}>
            <VStack gap={3} align="stretch">
              {/* Encabezados */}
              {items.length > 0 && (
                <Flex gap={2}>
                  <Text
                    flex={3}
                    fontSize="11px"
                    fontWeight="600"
                    color={c.textMuted}
                    textTransform="uppercase"
                  >
                    Ítem
                  </Text>
                  <Text
                    w="60px"
                    fontSize="11px"
                    fontWeight="600"
                    color={c.textMuted}
                    textTransform="uppercase"
                    textAlign="center"
                  >
                    Cant.
                  </Text>
                  <Text
                    w="80px"
                    fontSize="11px"
                    fontWeight="600"
                    color={c.textMuted}
                    textTransform="uppercase"
                    textAlign="right"
                  >
                    S/ unit.
                  </Text>
                  <Text
                    w="80px"
                    fontSize="11px"
                    fontWeight="600"
                    color={c.textMuted}
                    textTransform="uppercase"
                    textAlign="right"
                  >
                    Total
                  </Text>
                  <Box w="28px" />
                </Flex>
              )}

              {/* Filas de ítems */}
              {items.map((item, index) => (
                <Flex key={index} gap={2} align="center">
                  {/* Nombre */}
                  <Input
                    flex={3}
                    placeholder="Ej: Pan con chicharrón"
                    value={item.nombre}
                    onChange={(e) =>
                      actualizarItem(index, "nombre", e.target.value)
                    }
                    size="sm"
                    {...inputStyle}
                  />
                  {/* Cantidad */}
                  <Input
                    w="60px"
                    type="number"
                    placeholder="1"
                    value={item.cantidad}
                    onChange={(e) =>
                      actualizarItem(index, "cantidad", e.target.value)
                    }
                    size="sm"
                    textAlign="center"
                    {...inputStyle}
                  />
                  {/* Monto unitario */}
                  <Input
                    w="80px"
                    type="number"
                    placeholder="0.00"
                    value={item.monto}
                    onChange={(e) =>
                      actualizarItem(index, "monto", e.target.value)
                    }
                    size="sm"
                    textAlign="right"
                    {...inputStyle}
                  />
                  {/* Total del ítem */}
                  <Text
                    w="80px"
                    fontSize="sm"
                    fontWeight="600"
                    color={c.textPrimary}
                    textAlign="right"
                  >
                    {item.cantidad && item.monto
                      ? formatPEN(Number(item.cantidad) * Number(item.monto))
                      : "—"}
                  </Text>
                  {/* Eliminar */}
                  <AppButton
                    variant="ghost"
                    size="sm"
                    p={1}
                    w="28px"
                    color={c.textMuted}
                    _hover={{ color: "red.500", bg: "red.50" }}
                    onClick={() => eliminarItem(index)}
                  >
                    <MdDelete size={15} />
                  </AppButton>
                </Flex>
              ))}

              {/* Botón agregar ítem */}
              <AppButton
                size="sm"
                variant="outline"
                borderColor={c.borderColor}
                color={c.textSecondary}
                onClick={agregarItem}
                leftIcon={<MdAdd size={15} />}
              >
                Agregar ítem
              </AppButton>

              {/* Total desglose */}
              {items.length > 0 && totalItems > 0 && (
                <Flex
                  justify="space-between"
                  align="center"
                  pt={2}
                  borderTop="1px solid"
                  borderColor={c.borderColor}
                >
                  <Text fontSize="sm" fontWeight="600" color={c.textPrimary}>
                    Total desglose
                  </Text>
                  <Text fontSize="sm" fontWeight="700" color="green.500">
                    {formatPEN(totalItems)}
                  </Text>
                </Flex>
              )}

              {/* Advertencia si no coincide */}
              {items.length > 0 &&
                totalItems > 0 &&
                monto &&
                Math.abs(totalItems - Number(monto)) > 0.01 && (
                  <Box
                    bg="orange.50"
                    border="1px solid"
                    borderColor="orange.200"
                    borderRadius="lg"
                    p={3}
                  >
                    <Text fontSize="xs" color="orange.600">
                      ⚡ El total del desglose ({formatPEN(totalItems)}) no
                      coincide con el monto ({formatPEN(Number(monto))}). Se
                      usará el monto ingresado.
                    </Text>
                  </Box>
                )}
            </VStack>
          </Box>
        )}
      </Box>

      {/* Warning presupuesto */}
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

      {/* Botones */}
      {confirmando ? (
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
              onClick={doSubmit}
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
