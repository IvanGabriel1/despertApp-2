import { StyleSheet } from "react-native";
import { createContext, useEffect, useState } from "react";
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
  });
  const [alarmasProgramadas, setAlarmasProgramadas] = useState([]);
  const [cargado, setCargado] = useState(false);
  const abrirModal = () => setIsOpenModal(true);
  const cerrarModal = () => setIsOpenModal(false);

  const diaSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sabado",
  ];

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

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const alarmaId = notification.request.content.data?.alarmaId;
        if (!alarmaId) return;

        setAlarmasProgramadas((prev) => {
          const alarma = prev.find((a) => a.id === alarmaId);
          if (!alarma) return prev;

          // 🟢 alarma de una vez → borrar
          if (alarma.unavez) {
            return prev.filter((a) => a.id !== alarmaId);
          }

          // 🔁 alarma por días → reprogramar
          programarNotificacionPorDias(alarma);
          return prev;
        });
      },
    );

    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const guardadas = await AsyncStorage.getItem("alarmas");
      if (guardadas) {
        setAlarmasProgramadas(JSON.parse(guardadas));
      }
      setCargado(true); // 👈 clave
    })();
  }, []);

  useEffect(() => {
    if (!cargado) return;

    AsyncStorage.setItem("alarmas", JSON.stringify(alarmasProgramadas));
  }, [alarmasProgramadas, cargado]);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Debes habilitar las notificaciones para usar las alarmas.");
      }
    })();
  }, []);

  const cancelarNotificacion = async (id) => {
    await Notifications.cancelScheduledNotificationAsync(id);
  };

  const obtenerProximaFecha = (dia, hora, minutos) => {
    const diasSemana = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miercoles",
      "Jueves",
      "Viernes",
      "Sabado",
    ];

    const ahora = new Date();
    const fecha = new Date();

    fecha.setHours(parseInt(hora));
    fecha.setMinutes(parseInt(minutos));
    fecha.setSeconds(0);

    const hoy = ahora.getDay();
    const objetivo = diasSemana.indexOf(dia);

    let diff = objetivo - hoy;
    if (diff < 0 || (diff === 0 && fecha <= ahora)) diff += 7;

    fecha.setDate(fecha.getDate() + diff);

    return fecha;
  };

  const cancelarNotificacionesPorDias = async (notificationIds = {}) => {
    for (const id of Object.values(notificationIds)) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  };

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
    return futuras.slice(0, 15);
  };

  const programarNotificacion = async (alarma) => {
    const ahora = new Date();
    const fecha = new Date();

    fecha.setHours(Number(alarma.hora));
    fecha.setMinutes(Number(alarma.minutos));
    fecha.setSeconds(0);

    if (alarma.unavez && fecha <= ahora) {
      fecha.setDate(fecha.getDate() + 1);
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Despertapp",
        body: alarma.mensaje || "Notificación",
        sound: true,
        data: { alarmaId: alarma.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fecha,
        channelId: "alarmas",
      },
    });

    return id;
  };

  const programarNotificacionPorDias = async (alarma) => {
    const ids = {};

    for (const dia of alarma.dias) {
      const fecha = obtenerProximaFecha(dia, alarma.hora, alarma.minutos);

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Despertapp",
          body: alarma.mensaje || "Notificación",
          sound: true,
          data: {
            alarmaId: alarma.id,
            dia,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fecha,
          channelId: "alarmas",
        },
      });

      ids[dia] = id;
    }

    return ids;
  };

  const agregarAlarma = async (alarma) => {
    // const notificationId = await programarNotificacion(alarma);
    let notificationIds = {};

    if (alarma.unavez) {
      const id = await programarNotificacion(alarma);
      notificationIds = { once: id };
    } else {
      notificationIds = await programarNotificacionPorDias(alarma);
    }

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
        notificationIds,
        fechaDisparo: fechaDisparo.toISOString(),
      },
    ]);
  };

  const borrarItemAlarma = async (alarma) => {
    if (alarma.notificationIds) {
      for (const id of Object.values(alarma.notificationIds)) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
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
        cancelarNotificacionesPorDias,
        programarNotificacionPorDias,
      }}
    >
      {children}
    </AlarmaContext.Provider>
  );
};

const styles = StyleSheet.create({});
