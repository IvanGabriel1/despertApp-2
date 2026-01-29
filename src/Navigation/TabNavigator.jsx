import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../Components/Home";
import AlarmasProgramadas from "../Components/AlarmasProgramadas";
import AlarmasDeUnaVez from "../Components/AlarmasDeUnaVez";
import { FontAwesome } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();
// Tab Navigator - rnfes
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="home"
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <FontAwesome
              name="plus"
              size={24}
              color={focused ? `#666` : `#111`}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AlarmasProgramadas"
        component={AlarmasProgramadas}
        options={{
          tabBarIcon: ({ focused }) => (
            <FontAwesome
              name="calendar"
              size={24}
              color={focused ? `#666` : `#111`}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AlarmasDeUnaVez"
        component={AlarmasDeUnaVez}
        options={{
          tabBarIcon: ({ focused }) => (
            <FontAwesome
              name="bell"
              size={24}
              color={focused ? `#666` : `#111`}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({});
