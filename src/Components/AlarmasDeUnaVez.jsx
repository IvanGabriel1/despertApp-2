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

            <Text>Texto del mensaje:</Text>
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
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 32,
  },
  alarmasDeUnaVezTitle: {
    color: colors.primario,
    fontSize: 32,
    textDecorationLine: "underline",
    marginBottom: 16,
  },
  listaAlarmasDeUnaVezContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  listaAlarmasDeUnaVezItem: {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.primario,
    width: 350,
    marginBottom: 16,
  },
  alarmasDeUnaVezHyMItem: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: colors.primario,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  alarmasDeUnaVezPuntos: {
    color: colors.primario,
    fontSize: 32,
  },
  alarmasDeUnaVezHora: {
    color: colors.primario,
    fontSize: 32,
  },
  alarmasDeUnaVezMinutos: {
    color: colors.primario,
    fontSize: 32,
  },
  alarmasDeUnaVezContenedorBotones: {
    height: 56,
    flexDirection: "row",
  },
  alarmasDeUnaVezBorrar: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: colors.primario,
    justifyContent: "center",
    alignItems: "center",
  },
  alarmasDeUnaVezEditar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  alarmasDeUnaVezBorrarText: {
    fontSize: 24,
  },
  alarmasDeUnaVezMensajeContainer: {},
  alarmasDeUnaVezMensajeTexto: {},
  // Styles Modal:
  modalUnaVezContainer: {
    marginTop: 86,
    marginLeft: 32,
    marginRight: 32,
    marginBottom: 96,
    padding: 16,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.primario,
    backgroundColor: colors.fondo,
    flex: 1,
    alignItems: "center",
  },
  botonCerrarModalUnaVez: {
    backgroundColor: colors.primario,
    alignSelf: "center",
    padding: 6,
    paddingTop: 2,
    paddingBottom: 2,
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 10,
  },
  textBotonModalUnaVez: {
    color: colors.blanco,
    fontSize: 24,
    fontWeight: "bold",
  },
  modalTitleUnaVez: {
    color: colors.primario,
    fontSize: 24,
  },
  inputModalContainer: {
    flexDirection: "row",
    padding: 16,
  },
  inputsModal: {
    fontSize: 36,
    borderWidth: 1,
    borderColor: colors.primario,
    color: colors.primario,
  },
  inputsModalPuntos: {
    color: colors.primario,
    fontSize: 36,
    margin: 16,
  },
  botonGuardar: {
    backgroundColor: colors.primario,
    maxWidth: 250,
    borderRadius: 16,
    marginBottom: 16,
    padding: 8,
    margin: 16,
  },
  botonGuardarText: {
    alignSelf: "center",
    margin: "auto",
    color: colors.blanco,
    fontSize: 20,
    fontWeight: 800,
  },
});
