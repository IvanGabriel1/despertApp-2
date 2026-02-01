import { Pressable, StyleSheet, Text, View, FlatList } from "react-native";
import { useContext, useEffect, useState } from "react";
import { colors } from "../Global/colors";
import ModalNotificacion from "./ModalNotificacion";
import { NotificacionContext } from "../Context/NotificacionContext";

const Home = () => {
  const [relojAhora, setRelojAhora] = useState({
    hora: "",
    dia: "",
    mes: "",
    anio: "",
  });

  const [proximasNotificaciones, setProximasNotificaciones] = useState([]);

  const {
    isOpenModal,
    setIsOpenModal,
    notificacionesProgramadas,
    obtenerProximasNotificaciones,
  } = useContext(NotificacionContext);

  useEffect(() => {
    const proximas = obtenerProximasNotificaciones(notificacionesProgramadas);
    setProximasNotificaciones(proximas);
  }, [notificacionesProgramadas]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const ahora = new Date();

      setRelojAhora({
        hora: ahora.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        dia: ahora.getDate(),
        mes: ahora.getMonth() + 1,
        anio: ahora.getFullYear(),
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  const handleOpenModal = () => {
    setIsOpenModal(!isOpenModal);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.fecha}>
        Hoy es {relojAhora.dia}/{relojAhora.mes}/{relojAhora.anio}
      </Text>

      <Text style={styles.horaActual}>{relojAhora.hora}</Text>

      <View style={styles.notificacionesContainer}>
        <Text style={styles.notificacionesTitulo}>Próximas notificaciones</Text>

        {proximasNotificaciones.length === 0 ? (
          <Text style={styles.notificacionesVacias}>
            No hay notificaciones programadas
          </Text>
        ) : (
          <FlatList
            data={proximasNotificaciones}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.notificacionItem}>
                <Text style={styles.notificacionFecha}>
                  {item.proximaFecha.toLocaleString("es-AR", {
                    weekday: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </Text>
                <Text style={styles.notificacionMensaje}>{item.mensaje}</Text>
              </View>
            )}
          />
        )}
      </View>

      <Pressable onPress={handleOpenModal} style={styles.botonAgregar}>
        <Text style={styles.botonAgregarTexto}>+</Text>
      </Pressable>

      <ModalNotificacion />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.fondo,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
  },

  fecha: {
    color: colors.secundario,
    fontSize: 18,
    marginBottom: 8,
  },

  horaActual: {
    color: colors.primario,
    fontSize: 72,
    fontWeight: "700",
    marginBottom: 24,
  },

  notificacionesContainer: {
    width: "90%",
    backgroundColor: colors.blanco,
    borderRadius: 16,
    padding: 16,

    borderWidth: 1,
    borderColor: colors.secundario,
  },

  notificacionesTitulo: {
    fontSize: 20,
    color: colors.primario,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },

  notificacionesVacias: {
    color: colors.secundario,
    textAlign: "center",
    marginTop: 12,
  },

  notificacionItem: {
    borderBottomWidth: 1,
    borderColor: colors.secundario,
    paddingVertical: 10,
  },

  notificacionFecha: {
    color: colors.primario,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  notificacionMensaje: {
    color: colors.secundario,
    marginTop: 4,
  },

  botonAgregar: {
    backgroundColor: colors.primario,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    right: 24,
    elevation: 4,
  },

  botonAgregarTexto: {
    color: colors.blanco,
    fontSize: 40,
    fontWeight: "bold",
    marginTop: -2,
  },
});
