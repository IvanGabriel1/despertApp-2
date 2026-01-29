import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useContext, useRef, useState } from "react";
import { colors } from "../Global/colors";
import { AlarmaContext } from "../Context/AlarmaContext";
import { SafeAreaView } from "react-native-safe-area-context";

const AlarmasDeUnaVez = () => {
  const [isOpenModalUnaVez, setIsOpenModalUnaVez] = useState(false);
  const [alarmaSeleccionada, setAlarmaSeleccionada] = useState(null);
  const [nuevaHora, setNuevaHora] = useState(null);
  const [nuevaMinutos, setNuevaMinutos] = useState(null);
  const [nuevaMensaje, setNuevaMensaje] = useState(null);

  const {
    alarmasProgramadas,
    borrarItemAlarma,
    setAlarmasProgramadas,
    programarNotificacion,
    cancelarNotificacion,
  } = useContext(AlarmaContext);
  const minutosRef = useRef(null);

  const alarmasProgramadasDeUnaVez = alarmasProgramadas
    .filter((item) => item.unavez === true)
    .sort((a, b) => {
      const horaA = parseInt(a.hora, 10);
      const horaB = parseInt(b.hora, 10);

      if (horaA !== horaB) return horaA - horaB;

      const minutosA = parseInt(a.minutos, 10);
      const minutosB = parseInt(b.minutos, 10);

      return minutosA - minutosB;
    })
    .filter((item, index, self) => {
      return (
        index ===
        self.findIndex(
          (t) => t.hora === item.hora && t.minutos === item.minutos,
        )
      );
    });

  const btnEditar = (item) => {
    setAlarmaSeleccionada(item);
    setIsOpenModalUnaVez(true);
  };

  const btnCerrarModalUnaVez = () => {
    setIsOpenModalUnaVez(false);
    setNuevaHora(null);
    setNuevaMinutos(null);
    setAlarmaSeleccionada(null);
    setNuevaMensaje(null);
  };

  const guardarCambios = async () => {
    if (!alarmaSeleccionada) return;

    // usar variables locales para manipular valores
    let horaFinal =
      nuevaHora && nuevaHora.trim() !== ""
        ? nuevaHora
        : alarmaSeleccionada.hora;
    let minutosFinal =
      nuevaMinutos && nuevaMinutos.trim() !== ""
        ? nuevaMinutos
        : alarmaSeleccionada.minutos;

    const horaValida = horaFinal !== "" && minutosFinal !== "";

    if (!horaValida) {
      alert("Hora inválida");
      return;
    }

    let mensajeFinal =
      nuevaMensaje !== null ? nuevaMensaje : alarmaSeleccionada.mensaje;

    // formatear a dos dígitos
    if (horaFinal?.length === 1) horaFinal = horaFinal.padStart(2, "0");
    if (minutosFinal?.length === 1)
      minutosFinal = minutosFinal.padStart(2, "0");

    if (alarmaSeleccionada.notificationId) {
      await cancelarNotificacion(alarmaSeleccionada.notificationId);
    }

    const nuevaFechaDisparo = new Date();
    nuevaFechaDisparo.setHours(parseInt(horaFinal));
    nuevaFechaDisparo.setMinutes(parseInt(minutosFinal));
    nuevaFechaDisparo.setSeconds(0);

    if (nuevaFechaDisparo <= new Date()) {
      nuevaFechaDisparo.setDate(nuevaFechaDisparo.getDate() + 1);
    }

    const notificationId = await programarNotificacion({
      ...alarmaSeleccionada,
      hora: horaFinal,
      minutos: minutosFinal,
      mensaje: mensajeFinal,
      unavez: true,
      fecha: nuevaFechaDisparo,
    });

    setAlarmasProgramadas((prev) => {
      return prev.map((item) =>
        item.id === alarmaSeleccionada.id
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
  };

  return (
    <SafeAreaView style={styles.alarmasDeUnaVezContainer}>
      <Text style={styles.alarmasDeUnaVezTitle}>Alarmas de una vez:</Text>
      <View style={styles.listaAlarmasDeUnaVezContainer}>
        <FlatList
          data={alarmasProgramadasDeUnaVez}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.listaAlarmasDeUnaVezItem}>
              <View style={styles.alarmasDeUnaVezHyMItem}>
                <Text style={styles.alarmasDeUnaVezHora}>{item.hora}</Text>
                <Text style={styles.alarmasDeUnaVezPuntos}>:</Text>
                <Text style={styles.alarmasDeUnaVezMinutos}>
                  {item.minutos}
                </Text>
              </View>

              <View style={styles.alarmasDeUnaVezMensajeContainer}>
                <Text style={styles.alarmasDeUnaVezMensajeTexto}>
                  {item.mensaje}
                </Text>
              </View>

              <View style={styles.alarmasDeUnaVezContenedorBotones}>
                <Pressable
                  style={styles.alarmasDeUnaVezBorrar}
                  onPress={() => borrarItemAlarma(item)}
                >
                  <Text style={styles.alarmasDeUnaVezBorrarText}>Borrar</Text>
                </Pressable>
                <Pressable
                  style={styles.alarmasDeUnaVezEditar}
                  onPress={() => btnEditar(item)}
                >
                  <Text style={styles.alarmasDeUnaVezBorrarText}>Editar</Text>
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
            <Text style={styles.modalTitleUnaVez}>Modificar Alarma:</Text>

            {alarmaSeleccionada && (
              <View style={styles.inputModalContainer}>
                <TextInput
                  value={
                    nuevaHora === null
                      ? alarmaSeleccionada.hora // al abrir el modal, mostrar hora actual
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
                      ? alarmaSeleccionada.minutos
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

            {alarmaSeleccionada && (
              <View style={styles.textinputModalContainer}>
                <TextInput
                  style={styles.textinputModal}
                  value={
                    nuevaMensaje === null
                      ? alarmaSeleccionada.mensaje
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

export default AlarmasDeUnaVez;

const styles = StyleSheet.create({
  alarmasDeUnaVezContainer: {
    flex: 1,
    backgroundColor: colors.fondo,
    alignItems: "center",
    paddingTop: 24,
  },

  alarmasDeUnaVezTitle: {
    color: colors.primario,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },

  listaAlarmasDeUnaVezContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },

  listaAlarmasDeUnaVezItem: {
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

  alarmasDeUnaVezHyMItem: {
    flexDirection: "row",
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: colors.primarioAlphaColor50,
  },

  alarmasDeUnaVezHora: {
    color: colors.primario,
    fontSize: 36,
    fontWeight: "bold",
  },

  alarmasDeUnaVezPuntos: {
    color: colors.primario,
    fontSize: 36,
    fontWeight: "bold",
    marginHorizontal: 4,
  },

  alarmasDeUnaVezMinutos: {
    color: colors.primario,
    fontSize: 36,
    fontWeight: "bold",
  },

  alarmasDeUnaVezMensajeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  alarmasDeUnaVezMensajeTexto: {
    color: colors.secundario,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },

  alarmasDeUnaVezContenedorBotones: {
    flexDirection: "row",
    height: 56,
    borderTopWidth: 1.5,
    borderColor: colors.primario,
  },

  alarmasDeUnaVezBorrar: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

    backgroundColor: colors.rojoAlphaColor50,

    borderRightWidth: 1.5,
    borderColor: colors.primario,
  },

  alarmasDeUnaVezEditar: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

    backgroundColor: colors.primarioAlphaColor50,
  },

  alarmasDeUnaVezBorrarText: {
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
