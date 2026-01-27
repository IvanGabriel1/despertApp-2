import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import React, { useContext, useEffect, useState } from "react";
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
  const [alarmas, setAlarmas] = useState({});
  const [proximasAlarmas, setProximasAlarmas] = useState([]);

  const {
    isOpenModal,
    setIsOpenModal,
    cerrarModal,
    creandoAlarma,
    setCreandoAlarma,
    alarmasProgramadas,
    obtenerProximasAlarmas,
  } = useContext(AlarmaContext);

  useEffect(() => {
    const proximas = obtenerProximasAlarmas(alarmasProgramadas);
    setProximasAlarmas(proximas);
  }, [alarmasProgramadas]);

  // const [hora, setHora] = useState("");
  // const [minutos, setMinutos] = useState("");

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

  useEffect(() => {
    alert(
      "La aplicacion se encuentra en desarrollo, por el momento las alarmas solo funcionarán si la aplicación se encuentra en primer plano",
    );
  }, []);

  const handleOpenModal = () => {
    setIsOpenModal(!isOpenModal);
  };

  return (
    <View style={styles.homeContainer}>
      <Text style={styles.homeFecha}>
        Hoy es: {relojAhora.dia} / {relojAhora.mes} / {relojAhora.anio}
      </Text>
      <Text style={styles.homeHora}>{relojAhora.hora}</Text>
      <View style={styles.proximasAlarmasContainer}>
        <Text style={styles.proximasAlarmasTitle}>Proximas Alarmas:</Text>
        {proximasAlarmas.length === 0 ? (
          <Text>No hay alarmas programadas</Text>
        ) : (
          proximasAlarmas.map((a) => (
            <Text key={a.id} style={styles.proximasAlarmasText}>
              {a.proximaFecha.toLocaleString("es-AR", {
                weekday: "long",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
              {"\n"}
              mensaje: {a.mensaje}
            </Text>
          ))
        )}
      </View>

      <Pressable onPress={handleOpenModal} style={styles.boton}>
        <Text style={styles.textBoton}>+</Text>
      </Pressable>

      <ModalAlarma />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  homeFecha: {
    marginBottom: 16,
    color: colors.primario,
    fontSize: 24,
  },
  homeHora: {
    color: colors.primario,
    fontSize: 72,
  },
  proximasAlarmasContainer: {
    marginTop: 16,
  },
  proximasAlarmasTitle: {
    color: colors.primario,
    fontSize: 24,
  },
  boton: {
    backgroundColor: colors.primario,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 100,
    alignItems: "center",
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
  },
  textBoton: {
    color: "white",
    fontSize: 48,
    fontWeight: "bold",
  },
  proximasAlarmasText: {
    color: colors.primario,
    alignSelf: "center",
    marginTop: 16,
    fontSize: 16,
  },
});
