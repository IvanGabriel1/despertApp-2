import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useContext, useRef, useState } from "react";
import { colors } from "../Global/colors";
import { NotificacionContext } from "../Context/NotificacionContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { ToastAndroid } from "react-native";

const NotificacionsDeUnaVez = () => {
  const [isOpenModalUnaVez, setIsOpenModalUnaVez] = useState(false);
  const [notificacionSeleccionada, setNotificacionSeleccionada] =
    useState(null);
  const [nuevaHora, setNuevaHora] = useState(null);
  const [nuevaMinutos, setNuevaMinutos] = useState(null);
  const [nuevaMensaje, setNuevaMensaje] = useState(null);

  const {
    notificacionesProgramadas,
    borrarItemNotificacion,
    setNotificacionsProgramadas,
    programarNotificacion,
    cancelarNotificacion,
  } = useContext(NotificacionContext);
  const minutosRef = useRef(null);

  const notificacionesProgramadasDeUnaVez = notificacionesProgramadas
    .filter((item) => item.unavez === true)
    .sort((a, b) => {
      const horaA = parseInt(a.hora, 10);
      const horaB = parseInt(b.hora, 10);

      if (horaA !== horaB) return horaA - horaB;

      const minutosA = parseInt(a.minutos, 10);
      const minutosB = parseInt(b.minutos, 10);

      return minutosA - minutosB;
    });

  const btnEditar = (item) => {
    setNotificacionSeleccionada(item);
    setIsOpenModalUnaVez(true);
  };

  const btnCerrarModalUnaVez = () => {
    setIsOpenModalUnaVez(false);
    setNuevaHora(null);
    setNuevaMinutos(null);
    setNotificacionSeleccionada(null);
    setNuevaMensaje(null);
  };

  const guardarCambios = async () => {
    if (!notificacionSeleccionada) return;

    let horaFinal =
      nuevaHora && nuevaHora.trim() !== ""
        ? nuevaHora
        : notificacionSeleccionada.hora;
    let minutosFinal =
      nuevaMinutos && nuevaMinutos.trim() !== ""
        ? nuevaMinutos
        : notificacionSeleccionada.minutos;

    const horaValida = horaFinal !== "" && minutosFinal !== "";

    if (!horaValida) {
      alert("Hora inválida");
      return;
    }

    let mensajeFinal =
      nuevaMensaje !== null ? nuevaMensaje : notificacionSeleccionada.mensaje;

    if (mensajeFinal.length > 140) {
      alert("El mensaje tiene que tener menos de 140 caracterés");
      return;
    }

    if (horaFinal?.length === 1) horaFinal = horaFinal.padStart(2, "0");
    if (minutosFinal?.length === 1)
      minutosFinal = minutosFinal.padStart(2, "0");

    if (notificacionSeleccionada.notificationId) {
      await cancelarNotificacion(notificacionSeleccionada.notificationId);
    }

    const nuevaFechaDisparo = new Date();
    nuevaFechaDisparo.setHours(parseInt(horaFinal));
    nuevaFechaDisparo.setMinutes(parseInt(minutosFinal));
    nuevaFechaDisparo.setSeconds(0);

    if (nuevaFechaDisparo <= new Date()) {
      nuevaFechaDisparo.setDate(nuevaFechaDisparo.getDate() + 1);
    }

    const notificationId = await programarNotificacion({
      ...notificacionSeleccionada,
      hora: horaFinal,
      minutos: minutosFinal,
      mensaje: mensajeFinal,
      unavez: true,
      fecha: nuevaFechaDisparo,
    });

    setNotificacionsProgramadas((prev) => {
      return prev.map((item) =>
        item.id === notificacionSeleccionada.id
          ? {
              ...item,
              hora: horaFinal,
              minutos: minutosFinal,
              notificationId,
              mensaje: mensajeFinal,
            }
          : item,
      );
    });

    btnCerrarModalUnaVez();

    ToastAndroid.show(
      `Notificación actualizada a ${horaFinal}:${minutosFinal}`,
      ToastAndroid.SHORT,
    );
  };

  return (
    <SafeAreaView style={styles.notificacionesDeUnaVezContainer}>
      <Text style={styles.notificacionesDeUnaVezTitle}>
        Notificaciones de una vez:
      </Text>
      <View style={styles.listaNotificacionesDeUnaVezContainer}>
        <FlatList
          data={notificacionesProgramadasDeUnaVez}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.listaNotificacionesDeUnaVezItem}>
              <View style={styles.notificacionesDeUnaVezHyMItem}>
                <Text style={styles.notificacionesDeUnaVezHora}>
                  {item.hora}
                </Text>
                <Text style={styles.notificacionesDeUnaVezPuntos}>:</Text>
                <Text style={styles.notificacionesDeUnaVezMinutos}>
                  {item.minutos}
                </Text>
              </View>

              <View style={styles.notificacionesDeUnaVezMensajeContainer}>
                <Text style={styles.notificacionesDeUnaVezMensajeTexto}>
                  {item.mensaje}
                </Text>
              </View>

              <View style={styles.notificacionesDeUnaVezContenedorBotones}>
                <Pressable
                  style={styles.notificacionesDeUnaVezBorrar}
                  onPress={() => borrarItemNotificacion(item)}
                >
                  <Text style={styles.notificacionesDeUnaVezBorrarText}>
                    Borrar
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.notificacionesDeUnaVezEditar}
                  onPress={() => btnEditar(item)}
                >
                  <Text style={styles.notificacionesDeUnaVezBorrarText}>
                    Editar
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />

        <Modal
          visible={isOpenModalUnaVez}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalUnaVezContainer}>
            <Text style={styles.modalTitleUnaVez}>Modificar Notificacion:</Text>

            {notificacionSeleccionada && (
              <View style={styles.inputModalContainer}>
                <TextInput
                  value={
                    nuevaHora === null
                      ? notificacionSeleccionada.hora // al abrir el modal, mostrar hora actual
                      : nuevaHora // si el usuario escribe, usar eso
                  }
                  onChangeText={(text) => {
                    const cleanText = text.trim();

                    // Vacío → limpiar
                    if (cleanText === "") {
                      setNuevaHora("");
                      return;
                    }

                    // Solo números
                    if (!/^\d+$/.test(cleanText)) return;

                    // Máximo 2 caracteres
                    if (cleanText.length > 2) return;

                    const num = parseInt(cleanText, 10);

                    // Validar rango
                    if (num < 0 || num > 23) {
                      alert("Hora inválida. Usa formato 24h (00–23)");
                      setNuevaHora("23");
                      return;
                    }

                    if (text.length === 2) {
                      minutosRef.current?.focus();
                    }

                    // Permitir escribir normalmente (sin ceros todavía)
                    setNuevaHora(cleanText);
                  }}
                  onBlur={() => {
                    // Al salir del campo → formatear a 2 dígitos
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  style={styles.inputsModal}
                />

                <Text style={styles.inputsModalPuntos}>:</Text>
                <TextInput
                  ref={minutosRef}
                  value={
                    nuevaMinutos === null
                      ? notificacionSeleccionada.minutos
                      : nuevaMinutos
                  }
                  onChangeText={(text) => {
                    const cleanText = text.trim();

                    // Vacío → limpiar
                    if (cleanText === "") {
                      setNuevaMinutos("");
                      return;
                    }

                    // Solo números
                    if (!/^\d+$/.test(cleanText)) return;

                    // Máximo 2 caracteres
                    if (cleanText.length > 2) return;

                    const num = parseInt(cleanText, 10);

                    // Validar rango
                    if (num < 0 || num >= 60) {
                      alert("Hora inválida. Usa valores entre 00–59");
                      setNuevaMinutos("59");
                      return;
                    }

                    setNuevaMinutos(cleanText);
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  style={styles.inputsModal}
                />
              </View>
            )}

            <Text style={styles.labelModal}>Mensaje</Text>

            {notificacionSeleccionada && (
              <View style={styles.textinputModalContainer}>
                <TextInput
                  multiline
                  maxLength={140}
                  style={styles.textinputModal}
                  value={
                    nuevaMensaje === null
                      ? notificacionSeleccionada.mensaje
                      : nuevaMensaje
                  }
                  onChangeText={setNuevaMensaje}
                />
              </View>
            )}

            <Pressable
              onPress={() => btnCerrarModalUnaVez()}
              style={styles.botonCerrarModalUnaVez}
            >
              <Text style={styles.textBotonModalUnaVez}>X</Text>
            </Pressable>

            <Pressable
              onPress={() => guardarCambios()}
              style={styles.botonGuardar}
            >
              <Text style={styles.botonGuardarText}>Guardar</Text>
            </Pressable>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default NotificacionsDeUnaVez;

const styles = StyleSheet.create({
  notificacionesDeUnaVezContainer: {
    flex: 1,
    backgroundColor: colors.fondo,

    alignItems: "center",
    paddingTop: 24,
  },

  notificacionesDeUnaVezTitle: {
    color: colors.primario,
    fontSize: 28,
    fontWeight: "bold",
  },

  listaNotificacionesDeUnaVezContainer: {
    borderRadius: 20,
    backgroundColor: colors.fondo,
    width: 350,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  listaNotificacionesDeUnaVezItem: {
    backgroundColor: colors.blanco,
    borderRadius: 22,
    width: 350,
    marginBottom: 16,

    borderWidth: 2.5,
    borderColor: colors.primario,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,

    overflow: "hidden",
  },

  notificacionesDeUnaVezHyMItem: {
    flexDirection: "row",
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: colors.primarioAlphaColor50,
  },

  notificacionesDeUnaVezHora: {
    color: colors.primario,
    fontSize: 36,
    fontWeight: "bold",
  },

  notificacionesDeUnaVezPuntos: {
    color: colors.primario,
    fontSize: 36,
    fontWeight: "bold",
    marginHorizontal: 4,
  },

  notificacionesDeUnaVezMinutos: {
    color: colors.primario,
    fontSize: 36,
    fontWeight: "bold",
  },

  notificacionesDeUnaVezMensajeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  notificacionesDeUnaVezMensajeTexto: {
    color: colors.secundario,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },

  notificacionesDeUnaVezContenedorBotones: {
    flexDirection: "row",
    height: 56,
    borderTopWidth: 1.5,
    borderColor: colors.primario,
  },

  notificacionesDeUnaVezBorrar: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

    backgroundColor: colors.rojoAlphaColor50,

    borderRightWidth: 1.5,
    borderColor: colors.primario,
  },

  notificacionesDeUnaVezEditar: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

    backgroundColor: colors.primarioAlphaColor50,
  },

  notificacionesDeUnaVezBorrarText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  // 🔵 MODAL
  modalUnaVezContainer: {
    marginHorizontal: 24,
    marginVertical: 80,
    padding: 24,
    borderRadius: 28,
    backgroundColor: colors.blanco,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },

  modalTitleUnaVez: {
    color: colors.primario,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },

  botonCerrarModalUnaVez: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.rojo,
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  textBotonModalUnaVez: {
    color: colors.blanco,
    fontSize: 18,
    fontWeight: "bold",
  },

  inputModalContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },

  inputsModal: {
    width: 64,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.fondo,
    color: colors.primario,
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },

  inputsModalPuntos: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.primario,
    marginHorizontal: 10,
  },

  labelModal: {
    color: colors.primario,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    marginLeft: 4,
  },

  textinputModalContainer: {
    width: "100%",
    marginBottom: 16,
  },

  textinputModal: {
    width: "100%",
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.primario,
    borderRadius: 14,
    backgroundColor: colors.blanco,
    color: colors.secundario,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: "top",
  },

  botonGuardar: {
    backgroundColor: colors.primario,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 12,
  },

  botonGuardarText: {
    color: colors.blanco,
    fontSize: 18,
    fontWeight: "bold",
  },
});
