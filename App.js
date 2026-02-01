import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import TabNavigator from "./src/Navigation/TabNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { NotificacionProvider } from "./src/Context/NotificacionContext";

export default function App() {
  return (
    <NotificacionProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </NotificacionProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
