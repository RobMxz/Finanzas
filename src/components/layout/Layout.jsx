import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Box, Flex, Text, VStack, HStack } from "@chakra-ui/react";
import {
  MdDashboard,
  MdSwapHoriz,
  MdDonutLarge,
  MdSavings,
  MdLogout,
  MdChevronLeft,
  MdChevronRight,
  MdLightMode,
  MdDarkMode,
  MdPerson,
} from "react-icons/md";
import { FaWallet } from "react-icons/fa";
import AppButton from "../ui/AppButton";
import { useColorTheme } from "../../hooks/useColorTheme";
import useAppStore from "../../store/useAppStore";

const navItems = [
  { label: "Dashboard", path: "/", icon: MdDashboard },
  { label: "Transacciones", path: "/transacciones", icon: MdSwapHoriz },
  { label: "Presupuestos", path: "/presupuestos", icon: MdDonutLarge },
  { label: "Metas de ahorro", path: "/ahorros", icon: MdSavings },
  { label: "Perfil", path: "/perfil", icon: MdPerson },
];

export default function Layout() {
  const { user, signOut } = useAppStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const c = useColorTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const nombre = user?.user_metadata?.nombre || user?.email || "Usuario";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <Flex minH="100vh" bg={c.bgPage}>
      {/* ══ SIDEBAR desktop ══ */}
      <Box
        display={{ base: "none", md: "flex" }}
        flexDirection="column"
        position="fixed"
        top={0}
        left={0}
        h="100vh"
        w={sidebarOpen ? "240px" : "70px"}
        bg={c.bgSidebar}
        borderRight="1px solid"
        borderColor={c.borderColor}
        transition="width 0.2s cubic-bezier(0.4,0,0.2,1)"
        overflow="hidden"
        zIndex={100}
        boxShadow={c.shadow}
      >
        {/* Logo */}
        <Flex
          px={sidebarOpen ? 5 : 3}
          py={5}
          align="center"
          gap={3}
          borderBottom="1px solid"
          borderColor={c.borderLight}
          flexShrink={0}
          transition="padding 0.2s"
        >
          <Flex
            w="34px"
            h="34px"
            borderRadius="10px"
            bg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            align="center"
            justify="center"
            flexShrink={0}
            boxShadow="0 2px 8px rgba(34,197,94,0.35)"
          >
            <FaWallet size={16} color="white" />
          </Flex>
          {sidebarOpen && (
            <Box overflow="hidden">
              <Text
                fontWeight="700"
                fontSize="15px"
                color={c.textPrimary}
                whiteSpace="nowrap"
                letterSpacing="-0.3px"
              >
                Mis Finanzas
              </Text>
            </Box>
          )}
        </Flex>

        {/* Nav */}
        <VStack gap={1} align="stretch" p={2.5} flex={1} overflowY="auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} end={item.path === "/"}>
                {({ isActive }) => (
                  <Flex
                    align="center"
                    gap={3}
                    px={3}
                    py={2.5}
                    borderRadius="10px"
                    bg={isActive ? c.bgActiveNav : "transparent"}
                    color={isActive ? c.textActiveNav : c.textNav}
                    fontWeight={isActive ? "600" : "400"}
                    _hover={{
                      bg: isActive ? c.bgActiveNav : c.bgHover,
                      color: isActive ? c.textActiveNav : c.textPrimary,
                    }}
                    transition="all 0.15s"
                    cursor="pointer"
                    position="relative"
                  >
                    {/* Indicador activo */}
                    {isActive && (
                      <Box
                        position="absolute"
                        left={0}
                        top="50%"
                        transform="translateY(-50%)"
                        w="3px"
                        h="60%"
                        bg="green.500"
                        borderRadius="0 3px 3px 0"
                      />
                    )}
                    <Box
                      flexShrink={0}
                      ml={isActive ? 1 : 0}
                      transition="margin 0.15s"
                    >
                      <Icon size={19} />
                    </Box>
                    {sidebarOpen && (
                      <Text fontSize="14px" whiteSpace="nowrap">
                        {item.label}
                      </Text>
                    )}
                  </Flex>
                )}
              </NavLink>
            );
          })}
        </VStack>

        {/* Cerrar sesión */}
        <Box
          p={2.5}
          borderTop="1px solid"
          borderColor={c.borderLight}
          flexShrink={0}
        >
          <Flex
            align="center"
            gap={3}
            px={3}
            py={2.5}
            borderRadius="10px"
            cursor="pointer"
            color={c.textMuted}
            _hover={{ bg: "rgba(239,68,68,0.08)", color: "red.500" }}
            onClick={handleSignOut}
            transition="all 0.15s"
          >
            <Box flexShrink={0}>
              <MdLogout size={19} />
            </Box>
            {sidebarOpen && (
              <Text fontSize="14px" whiteSpace="nowrap">
                Cerrar sesión
              </Text>
            )}
          </Flex>
        </Box>
      </Box>

      {/* ══ CONTENIDO PRINCIPAL ══ */}
      <Box
        ml={{ base: 0, md: sidebarOpen ? "240px" : "70px" }}
        transition="margin-left 0.2s cubic-bezier(0.4,0,0.2,1)"
        flex={1}
        display="flex"
        flexDirection="column"
        minH="100vh"
        pb={{ base: "70px", md: 0 }}
      >
        {/* Header */}
        <Flex
          px={{ base: 4, md: 6 }}
          py={3.5}
          bg={c.bgCard}
          borderBottom="1px solid"
          borderColor={c.borderColor}
          align="center"
          justify="space-between"
          position="sticky"
          top={0}
          zIndex={50}
          boxShadow={c.shadow}
        >
          <Flex align="center" gap={3}>
            {/* Colapsar — desktop */}
            <Box display={{ base: "none", md: "block" }}>
              <AppButton
                variant="ghost"
                size="sm"
                px={2}
                color={c.textMuted}
                _hover={{ bg: c.bgHover, color: c.textPrimary }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                borderRadius="8px"
              >
                {sidebarOpen ? (
                  <MdChevronLeft size={20} />
                ) : (
                  <MdChevronRight size={20} />
                )}
              </AppButton>
            </Box>

            {/* Logo móvil */}
            <Flex display={{ base: "flex", md: "none" }} align="center" gap={2}>
              <Flex
                w="28px"
                h="28px"
                borderRadius="8px"
                bg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                align="center"
                justify="center"
              >
                <FaWallet size={13} color="white" />
              </Flex>
              <Text
                fontWeight="700"
                fontSize="15px"
                color={c.textPrimary}
                letterSpacing="-0.3px"
              >
                Mis Finanzas
              </Text>
            </Flex>
          </Flex>

          <HStack gap={2}>
            {/* Toggle tema */}
            <AppButton
              variant="ghost"
              size="sm"
              px={2}
              color={c.textMuted}
              _hover={{ bg: c.bgHover, color: c.textPrimary }}
              onClick={c.toggleColorMode}
              borderRadius="8px"
            >
              {c.isDark ? <MdLightMode size={19} /> : <MdDarkMode size={19} />}
            </AppButton>

            {/* Separador */}
            <Box
              w="1px"
              h="20px"
              bg={c.borderColor}
              display={{ base: "none", sm: "block" }}
            />

            {/* Usuario */}
            <HStack
              gap={2.5}
              cursor="pointer"
              onClick={() => navigate("/perfil")}
              px={2}
              py={1}
              borderRadius="8px"
              _hover={{ bg: c.bgHover }}
              transition="background 0.15s"
            >
              <Box textAlign="right" display={{ base: "none", sm: "block" }}>
                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color={c.textPrimary}
                  lineHeight="1.3"
                >
                  {nombre}
                </Text>
                <Text fontSize="11px" color={c.textMuted}>
                  {user?.email}
                </Text>
              </Box>
              <Flex
                w="32px"
                h="32px"
                borderRadius="full"
                bg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                align="center"
                justify="center"
                flexShrink={0}
                boxShadow="0 2px 6px rgba(34,197,94,0.3)"
              >
                <Text fontSize="13px" fontWeight="700" color="white">
                  {inicial}
                </Text>
              </Flex>
            </HStack>
          </HStack>
        </Flex>

        {/* Página */}
        <Box p={{ base: 4, md: 6 }} flex={1} className="animate-fadeIn">
          <Outlet />
        </Box>
      </Box>

      {/* ══ BOTTOM NAV móvil ══ */}
      <Box
        display={{ base: "flex", md: "none" }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg={c.bgCard}
        borderTop="1px solid"
        borderColor={c.borderColor}
        zIndex={100}
        h="65px"
        px={2}
        boxShadow="0 -4px 20px rgba(0,0,0,0.06)"
      >
        <Flex w="full" justify="space-around" align="center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} end={item.path === "/"}>
                {({ isActive }) => (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    gap={0.5}
                    px={3}
                    py={2}
                    borderRadius="12px"
                    color={isActive ? "green.500" : c.textMuted}
                    bg={isActive ? c.bgActiveNav : "transparent"}
                    transition="all 0.15s"
                    minW="52px"
                  >
                    <Icon size={21} />
                    <Text
                      fontSize="9px"
                      fontWeight={isActive ? "600" : "400"}
                      whiteSpace="nowrap"
                    >
                      {item.label === "Metas de ahorro"
                        ? "Ahorros"
                        : item.label}
                    </Text>
                  </Flex>
                )}
              </NavLink>
            );
          })}
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap={0.5}
            px={3}
            py={2}
            borderRadius="12px"
            color={c.textMuted}
            _hover={{ color: "red.500" }}
            transition="all 0.15s"
            cursor="pointer"
            minW="52px"
            onClick={handleSignOut}
          >
            <MdLogout size={21} />
            <Text fontSize="9px">Salir</Text>
          </Flex>
        </Flex>
      </Box>
    </Flex>
  );
}
