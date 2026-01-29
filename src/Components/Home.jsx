import { Pressable, StyleSheet, Text, View } from "react-native";
import { useContext, useEffect, useState } from "react";
import { colors } from "../Global/colors";
import ModalAlarma from "./ModalAlarma";
import { AlarmaContext } from "../Context/AlarmaContext";

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
    alarmasProgramadas,
    obtenerProximasAlarmas,
  } = useContext(AlarmaContext);

  useEffect(() => {
    const proximas = obtenerProximasAlarmas(alarmasProgramadas);
    setProximasNotificaciones(proximas);
  }, [alarmasProgramadas]);

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
          proximasNotificaciones.map((n) => (
            <View key={n.id} style={styles.notificacionItem}>
              <Text style={styles.notificacionFecha}>
                {n.proximaFecha.toLocaleString("es-AR", {
                  weekday: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </Text>
              <Text style={styles.notificacionMensaje}>{n.mensaje}</Text>
            </View>
          ))
        )}
      </View>

      <Pressable onPress={handleOpenModal} style={styles.botonAgregar}>
        <Text style={styles.botonAgregarTexto}>+</Text>
      </Pressable>

      <ModalAlarma />
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
    color: colors.textoSecundario,
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
    borderColor: colors.borde,
  },

  notificacionesTitulo: {
    fontSize: 20,
    color: colors.primario,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },

  notificacionesVacias: {
    color: colors.textoSecundario,
    textAlign: "center",
    marginTop: 12,
  },

  notificacionItem: {
    borderBottomWidth: 1,
    borderColor: colors.borde,
    paddingVertical: 10,
  },

  notificacionFecha: {
    color: colors.textoPrimario,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  notificacionMensaje: {
    color: colors.textoSecundario,
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
