import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../Components/Home";
import NotificacionesProgramadas from "../Components/NotificacionesProgramadas";
import NotificacionesDeUnaVez from "../Components/NotificacionesDeUnaVez";
import { FontAwesome } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();
// Tab Navigator - rnfes
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#DBEAFE", // primarioClaro
          borderTopWidth: 0,
          elevation: 10,
        },
        tabBarActiveTintColor: "#2563EB", // primario
        tabBarInactiveTintColor: "#1E293B",
      }}
    >
      <Tab.Screen
        name="home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="plus" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificacionsProgramadas"
        component={NotificacionesProgramadas}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificacionsDeUnaVez"
        component={NotificacionesDeUnaVez}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="bell" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({});
