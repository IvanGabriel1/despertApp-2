import { StyleSheet } from "react-native";
import { createContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const NotificacionContext = createContext();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificacionProvider = ({ children }) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [creandoNotificacion, setCreandoNotificacion] = useState({
    id: "",
    unavez: true,
    dias: [],
    hora: "",
    minutos: "",
    mensaje: "",
  });
  const [notificacionesProgramadas, setNotificacionsProgramadas] = useState([]);
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
      Notifications.setNotificationChannelAsync("notificacions", {
        name: "Notificacions",
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
        const notificacionId =
          notification.request.content.data?.notificacionId;
        if (!notificacionId) return;

        setNotificacionsProgramadas((prev) => {
          const notificacion = prev.find((a) => a.id === notificacionId);
          if (!notificacion) return prev;

          // 🟢 notificacion de una vez → borrar
          if (notificacion.unavez) {
            return prev.filter((a) => a.id !== notificacionId);
          }

          // 🔁 notificacion por días → reprogramar
          programarNotificacionPorDias(notificacion);
          return prev;
        });
      },
    );

    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const guardadas = await AsyncStorage.getItem("notificacions");
      if (guardadas) {
        setNotificacionsProgramadas(JSON.parse(guardadas));
      }
      setCargado(true); // 👈 clave
    })();
  }, []);

  useEffect(() => {
    if (!cargado) return;

    AsyncStorage.setItem(
      "notificacions",
      JSON.stringify(notificacionesProgramadas),
    );
  }, [notificacionesProgramadas, cargado]);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert(
          "Debes habilitar las notificaciones para usar las notificacions.",
        );
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

  const obtenerProximasNotificaciones = (notificacionesProgramadas) => {
    if (!notificacionesProgramadas || notificacionesProgramadas.length === 0)
      return [];

    const ahora = new Date();

    const notificacionsConFecha = notificacionesProgramadas.map(
      (notificacion) => {
        const hora = parseInt(notificacion.hora);
        const minutos = parseInt(notificacion.minutos);

        //Notificacion de una vez
        if (notificacion.unavez) {
          const fecha = new Date();
          fecha.setHours(hora);
          fecha.setMinutes(minutos);
          fecha.setSeconds(0);

          if (fecha <= ahora) fecha.setDate(fecha.getDate() + 1);

          return { ...notificacion, proximaFecha: fecha };
        }

        //Notificacion programada por dias:

        let proximaFecha = null;

        for (let i = 0; i < 7; i++) {
          const fecha = new Date();
          fecha.setDate(ahora.getDate() + i);
          const dia = diaSemana[fecha.getDay()];
          if (
            Array.isArray(notificacion.dias) &&
            notificacion.dias.includes(dia)
          ) {
            fecha.setHours(hora);
            fecha.setMinutes(minutos);
            fecha.setSeconds(0);

            if (i === 0 && fecha <= ahora) {
              fecha.setDate(fecha.getDate() + 7);
              proximaFecha = fecha;
              break;
            }

            proximaFecha = fecha;

            break;
          }
        }

        return { ...notificacion, proximaFecha };
      },
    );

    // Filtra las que tienen una próxima fecha valida
    const futuras = notificacionsConFecha.filter((a) => a.proximaFecha);

    // Ordenar por fecha mas cercana
    futuras.sort((a, b) => a.proximaFecha - b.proximaFecha);

    // devolver solo 5:
    return futuras.slice(0, 5);
  };

  const programarNotificacion = async (notificacion) => {
    const ahora = new Date();
    const fecha = new Date();

    fecha.setHours(Number(notificacion.hora));
    fecha.setMinutes(Number(notificacion.minutos));
    fecha.setSeconds(0);

    if (notificacion.unavez && fecha <= ahora) {
      fecha.setDate(fecha.getDate() + 1);
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Notis - Nueva notificacion",
        body: notificacion.mensaje || "Notificación",
        sound: true,
        data: { notificacionId: notificacion.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fecha,
        channelId: "notificacions",
      },
    });

    return id;
  };

  const programarNotificacionPorDias = async (notificacion) => {
    const ids = {};

    for (const dia of notificacion.dias) {
      const fecha = obtenerProximaFecha(
        dia,
        notificacion.hora,
        notificacion.minutos,
      );

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Nueva notificacion",
          body: notificacion.mensaje || "Notificación",
          sound: true,
          data: {
            notificacionId: notificacion.id,
            dia,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fecha,
          channelId: "notificacions",
        },
      });

      ids[dia] = id;
    }

    return ids;
  };

  const agregarNotificacion = async (notificacion) => {
    // const notificationId = await programarNotificacion(notificacion);
    let notificationIds = {};

    if (notificacion.unavez) {
      const id = await programarNotificacion(notificacion);
      notificationIds = { once: id };
    } else {
      notificationIds = await programarNotificacionPorDias(notificacion);
    }

    const fechaDisparo = new Date();
    fechaDisparo.setHours(parseInt(notificacion.hora));
    fechaDisparo.setMinutes(parseInt(notificacion.minutos));
    fechaDisparo.setSeconds(0);

    if (notificacion.unavez && fechaDisparo <= new Date()) {
      fechaDisparo.setDate(fechaDisparo.getDate() + 1);
    }

    setNotificacionsProgramadas((prev) => [
      ...prev,
      {
        ...notificacion,
        notificationIds,
        fechaDisparo: fechaDisparo.toISOString(),
      },
    ]);
  };

  const borrarItemNotificacion = async (notificacion) => {
    if (notificacion.notificationIds) {
      for (const id of Object.values(notificacion.notificationIds)) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }

    setNotificacionsProgramadas((prev) =>
      prev.filter((a) => a.id !== notificacion.id),
    );
  };

  return (
    <NotificacionContext.Provider
      value={{
        isOpenModal,
        setIsOpenModal,
        creandoNotificacion,
        setCreandoNotificacion,
        abrirModal,
        cerrarModal,
        setNotificacionsProgramadas,
        notificacionesProgramadas,
        agregarNotificacion,
        borrarItemNotificacion,
        obtenerProximasNotificaciones,
        programarNotificacion,
        cancelarNotificacion,
        cancelarNotificacionesPorDias,
        programarNotificacionPorDias,
      }}
    >
      {children}
    </NotificacionContext.Provider>
  );
};

const styles = StyleSheet.create({});
