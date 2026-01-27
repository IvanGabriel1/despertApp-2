import { StyleSheet } from "react-native";
import React, { createContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const AlarmaContext = createContext();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const AlarmaProvider = ({ children }) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [creandoAlarma, setCreandoAlarma] = useState({
    id: "",
    unavez: true,
    dias: [],
    hora: "",
    minutos: "",
    mensaje: "",
    notificacion: "",
  });
  const [alarmasProgramadas, setAlarmasProgramadas] = useState([]);

  const diaSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sabado",
  ];
  const hoy = diaSemana[new Date().getDay()];

  const diasANumero = {
    Domingo: 0,
    Lunes: 1,
    Martes: 2,
    Miercoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sabado: 6,
  };

  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("alarmas", {
        name: "Alarmas",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  }, []);

  const obtenerProximasAlarmas = (alarmasProgramadas) => {
    if (!alarmasProgramadas || alarmasProgramadas.length === 0) return [];

    const ahora = new Date();

    const alarmasConFecha = alarmasProgramadas.map((alarma) => {
      const hora = parseInt(alarma.hora);
      const minutos = parseInt(alarma.minutos);

      //Alarma de una vez
      if (alarma.unavez) {
        const fecha = new Date();
        fecha.setHours(hora);
        fecha.setMinutes(minutos);
        fecha.setSeconds(0);

        if (fecha <= ahora) fecha.setDate(fecha.getDate() + 1);

        return { ...alarma, proximaFecha: fecha };
      }

      //Alarma programada por dias:

      let proximaFecha = null;

      for (let i = 0; i < 7; i++) {
        const fecha = new Date();
        fecha.setDate(ahora.getDate() + i);
        const dia = diaSemana[fecha.getDay()];
        if (Array.isArray(alarma.dias) && alarma.dias.includes(dia)) {
          fecha.setHours(hora);
          fecha.setMinutes(minutos);
          fecha.setSeconds(0);

          if (i === 0 && fecha <= ahora) continue;

          proximaFecha = fecha;

          break;
        }
      }

      return { ...alarma, proximaFecha };
    });

    // Filtra las que tienen una próxima fecha valida
    const futuras = alarmasConFecha.filter((a) => a.proximaFecha);

    // Ordenar por fecha mas cercana
    futuras.sort((a, b) => a.proximaFecha - b.proximaFecha);

    // devolver solo 2:
    return futuras.slice(0, 2);
  };

  //Limpieza de notificaciones de una vez que ya pasaron
  useEffect(() => {
    const ahora = new Date();

    setAlarmasProgramadas((prev) =>
      prev.filter((alarma) => {
        if (!alarma.unavez) return true;

        const fecha = new Date(alarma.fechaDisparo);
        return fecha > ahora;
      }),
    );
  }, []);

  const programarNotificacion = async (alarma) => {
    try {
      console.log("ANTES");
      const { hora, minutos, unavez, dias, mensaje } = alarma;

      const ahora = new Date();
      const fecha = new Date();

      fecha.setHours(parseInt(hora));
      fecha.setMinutes(parseInt(minutos));
      fecha.setSeconds(0);

      // Si es una sola vez y ya pasó hoy → mañana
      if (unavez && fecha <= ahora) {
        fecha.setDate(fecha.getDate() + 1);
      }

      console.log("📅 Se va a disparar a:", fecha.toString());

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Despertapp",
          body: alarma.mensaje || "Notificación",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fecha,
          channelId: "alarmas",
        },
      });

      console.log("DESPUÉS", id);

      console.log("📢 ID generado:", id);
      return id;
    } catch (error) {
      console.error("❌ Error programando notificación:", error);
    }
  };

  const cancelarNotificacion = async (notificationId) => {
    try {
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        console.log(`🛑 Notificación ${notificationId} cancelada`);
      }
    } catch (error) {
      console.log("❌ Error al cancelar notificación:", error);
    }
  };

  useEffect(() => {
    AsyncStorage.setItem("alarmas", JSON.stringify(alarmasProgramadas));
  }, [alarmasProgramadas]);

  useEffect(() => {
    (async () => {
      const guardadas = await AsyncStorage.getItem("alarmas");
      console.log("Alarmas en storage:", guardadas);
      if (guardadas) setAlarmasProgramadas(JSON.parse(guardadas));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Debes habilitar las notificaciones para usar las alarmas.");
      }
    })();
  }, []);

  const abrirModal = () => setIsOpenModal(true);
  const cerrarModal = () => setIsOpenModal(false);

  const agregarAlarma = async (alarma) => {
    const notificationId = await programarNotificacion(alarma);

    const fechaDisparo = new Date();
    fechaDisparo.setHours(parseInt(alarma.hora));
    fechaDisparo.setMinutes(parseInt(alarma.minutos));
    fechaDisparo.setSeconds(0);

    if (alarma.unavez && fechaDisparo <= new Date()) {
      fechaDisparo.setDate(fechaDisparo.getDate() + 1);
    }

    setAlarmasProgramadas((prev) => [
      ...prev,
      {
        ...alarma,
        notificationId,
        fechaDisparo: fechaDisparo.toISOString(),
      },
    ]);
  };

  const borrarItemAlarma = async (alarma) => {
    if (alarma.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        alarma.notificationId,
      );
    }

    setAlarmasProgramadas((prev) => prev.filter((a) => a.id !== alarma.id));
  };

  return (
    <AlarmaContext.Provider
      value={{
        isOpenModal,
        setIsOpenModal,
        creandoAlarma,
        setCreandoAlarma,
        abrirModal,
        cerrarModal,
        setAlarmasProgramadas,
        alarmasProgramadas,
        agregarAlarma,
        borrarItemAlarma,
        obtenerProximasAlarmas,
        programarNotificacion,
        cancelarNotificacion,
      }}
    >
      {children}
    </AlarmaContext.Provider>
  );
};

const styles = StyleSheet.create({});
