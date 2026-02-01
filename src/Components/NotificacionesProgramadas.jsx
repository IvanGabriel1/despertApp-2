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

const NotificacionsProgramadas = () => {
  const [isOpenModalProgramadas, setIsOpenModalProgramadas] = useState(false);
  const [notificacionSeleccionada, setNotificacionSeleccionada] =
    useState(null);
  const [nuevaHora, setNuevaHora] = useState(null);
  const [nuevaMinutos, setNuevaMinutos] = useState(null);
  const [nuevaMensaje, setNuevaMensaje] = useState(null);
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);

  const DIAS = [
    { label: "L", value: "Lunes" },
    { label: "M", value: "Martes" },
    { label: "M", value: "Miercoles" },
    { label: "J", value: "Jueves" },
    { label: "V", value: "Viernes" },
    { label: "S", value: "Sabado" },
    { label: "D", value: "Domingo" },
  ];

  const {
    notificacionesProgramadas,
    borrarItemNotificacion,
    setNotificacionsProgramadas,
    programarNotificacionPorDias,
    cancelarNotificacionesPorDias,
  } = useContext(NotificacionContext);
  const minutosRef = useRef(null);

  const notificacionesProgramadasDias = notificacionesProgramadas
    .filter((item) => item.unavez === false)
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
    setNuevaHora(null);
    setNuevaMinutos(null);
    setNuevaMensaje(null);
    setDiasSeleccionados(item.dias || []);
    setIsOpenModalProgramadas(true);
  };

  const btnCerrarModalUnaVez = () => {
    setIsOpenModalProgramadas(false);

    setNuevaHora(null);
    setNuevaMinutos(null);
    setNotificacionSeleccionada(null);
    setNuevaMensaje(null);
    setDiasSeleccionados([]);
  };

  const guardarCambios = async () => {
    try {
      if (!notificacionSeleccionada) return;

      let horaFinal =
        nuevaHora && nuevaHora.trim() !== ""
          ? nuevaHora
          : notificacionSeleccionada.hora;
      let minutosFinal =
        nuevaMinutos && nuevaMinutos.trim() !== ""
          ? nuevaMinutos
          : notificacionSeleccionada.minutos;

      if (!horaFinal || !minutosFinal) {
        alert("La notificacion debe tener hora y minutos");
        return;
      }

      let mensajeFinal =
        nuevaMensaje !== null ? nuevaMensaje : notificacionSeleccionada.mensaje;

      if (mensajeFinal.length > 140) {
        alert("El mensaje tiene que tener menos de 140 caracterés");
        return;
      }

      // formatear a dos dígitos
      if (horaFinal?.length === 1) horaFinal = horaFinal.padStart(2, "0");
      if (minutosFinal?.length === 1)
        minutosFinal = minutosFinal.padStart(2, "0");

      // guardar cambios realizados en los dias:
      if (diasSeleccionados.length === 0) {
        alert("Tenés que seleccionar al menos un día");
        return;
      }

      const nuevosDias = diasSeleccionados;

      if (notificacionSeleccionada.notificationIds) {
        await cancelarNotificacionesPorDias(
          notificacionSeleccionada.notificationIds,
        );
      }

      const notificationIds = await programarNotificacionPorDias({
        ...notificacionSeleccionada,
        hora: horaFinal,
        minutos: minutosFinal,
        dias: nuevosDias,
        mensaje: mensajeFinal,
      });

      const notificacionActualizada = {
        ...notificacionSeleccionada,
        hora: horaFinal,
        minutos: minutosFinal,
        dias: nuevosDias,
        unavez: false,
        mensaje: mensajeFinal,
        notificationIds,
      };

      setNotificacionsProgramadas((prev) =>
        prev.map((item) =>
          item.id === notificacionSeleccionada.id
            ? notificacionActualizada
            : item,
        ),
      );

      btnCerrarModalUnaVez();

      ToastAndroid.show(
        `Notificación actualizada a ${horaFinal}:${minutosFinal}`,
        ToastAndroid.SHORT,
      );
    } catch (error) {
      console.log("Error:", error);
    }
  };

  const toggleDia = (dia) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
  };

  return (
    <SafeAreaView style={styles.notificacionesProgramadasContainer}>
      <Text style={styles.notificacionesProgramadasTitle}>
        Notificaciones Programadas:
      </Text>
      <View style={styles.listaNotificacionesProgramadasContainer}>
        <FlatList
          data={notificacionesProgramadasDias}
          keyExtractor={(item) => item.id.toString()}
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

              <View style={styles.diasViewContainer}>
                <View style={styles.diasContainer}>
                  <View style={styles.diasContainer}>
                    {DIAS.map((dia) => (
                      <Pressable
                        key={dia.value}
                        style={[
                          styles.diaView,
                          item.dias.includes(dia.value) &&
                            styles.diaSemanaActivo,
                        ]}
                      >
                        <Text
                          style={[
                            styles.diaPressableText,
                            item.dias.includes(dia.value) &&
                              styles.diaPressableTextActivo,
                          ]}
                        >
                          {dia.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.notificacionesProgramadasMensajeContainer}>
                <Text style={styles.notificacionesProgramadasMensajeTexto}>
                  {item.mensaje}
                </Text>
              </View>

              <View style={styles.notificacionesDeUnaVezContenedorBotones}>
                <Pressable
                  style={styles.notificacionesProgramadasBorrar}
                  onPress={async () => {
                    if (item.notificationIds) {
                      await cancelarNotificacionesPorDias(item.notificationIds);
                    }
                    borrarItemNotificacion(item);
                  }}
                >
                  <Text style={styles.notificacionesProgramadasBorrarText}>
                    Borrar
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.notificacionesProgramadasEditar}
                  onPress={() => btnEditar(item)}
                >
                  <Text style={styles.notificacionesProgramadasBorrarText}>
                    Editar
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />

        <Modal
          visible={isOpenModalProgramadas}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalProgramadasContainer}>
            <Text style={styles.modalTitleProgramadas}>
              Modificar Notificacion:
            </Text>

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
                      alert("Minutos inválida. Usa formato (00–59)");
                      setNuevaMinutos("59");
                      return;
                    }

                    if (text.length === 2) {
                      minutosRef.current?.focus();
                    }

                    setNuevaMinutos(cleanText);
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  style={styles.inputsModal}
                />
              </View>
            )}

            <View style={styles.diasContainer}>
              {DIAS.map((dia) => (
                <Pressable
                  key={dia.value}
                  style={[
                    styles.diaView,
                    diasSeleccionados.includes(dia.value) &&
                      styles.diaSemanaActivo,
                  ]}
                  onPress={() => toggleDia(dia.value)}
                >
                  <Text
                    style={[
                      styles.diaPressableText,
                      diasSeleccionados.includes(dia.value) &&
                        styles.diaPressableTextActivo,
                    ]}
                  >
                    {dia.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.mensajeLabel}>Mensaje</Text>

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
              style={styles.botonCerrarModalProgramadas}
            >
              <Text style={styles.textBotonModalProgramadas}>X</Text>
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

export default NotificacionsProgramadas;

const styles = StyleSheet.create({
  notificacionesProgramadasContainer: {
    flex: 1,
    backgroundColor: colors.fondo,
    alignItems: "center",
    paddingTop: 24,
  },
  notificacionesProgramadasTitle: {
    color: colors.primario,
    fontSize: 28,
    fontWeight: "bold",
  },
  listaNotificacionesProgramadasContainer: {
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
    borderColor: colors.primario,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  notificacionesDeUnaVezPuntos: {
    color: colors.primario,
    fontSize: 36,
    fontWeight: "bold",
  },
  notificacionesDeUnaVezHora: {
    color: colors.primario,
    fontSize: 36,
    fontWeight: "bold",
  },
  notificacionesDeUnaVezMinutos: {
    color: colors.primario,
    fontSize: 36,
    fontWeight: "bold",
  },
  notificacionesDeUnaVezContenedorBotones: {
    flexDirection: "row",
    height: 56,
    borderTopWidth: 1.5,
    borderColor: colors.primario,
  },
  notificacionesProgramadasBorrar: {
    flex: 1,
    borderRightWidth: 1,
    borderBottomLeftRadius: 15,
    borderColor: colors.primario,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.rojoAlphaColor50,
  },
  notificacionesProgramadasEditar: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primarioClaro,
    borderBottomRightRadius: 15,
  },
  notificacionesProgramadasBorrarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.secundario,
  },
  // Styles "Dias":
  diasViewContainer: {
    height: 150,
    borderBottomWidth: 1,
    borderColor: colors.primario,
  },
  diasContainer: {
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  diaView: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.primario,
    margin: 6,
    backgroundColor: colors.primarioClaro,
    alignItems: "center",
    justifyContent: "center",
  },
  diaPressableText: {
    color: colors.primario,
    fontWeight: "bold",
  },
  diaPressableTextActivo: {
    color: colors.blanco,
  },
  diaSemanaActivo: {
    backgroundColor: colors.primario,
  },
  notificacionesProgramadasMensajeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.primarioAlphaColor50,
    backgroundColor: colors.fondo,
  },

  notificacionesProgramadasMensajeTexto: {
    color: colors.secundario,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
  textinputModalContainer: {
    width: "100%",
    marginTop: 12,
  },
  mensajeLabel: {
    color: colors.primario,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    marginLeft: 4,
  },
  textinputModal: {
    width: "100%",
    minHeight: 120,
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
  // Styles Modal:
  modalProgramadasContainer: {
    margin: 24,
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.blanco,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  botonCerrarModalProgramadas: {
    backgroundColor: colors.rojo,
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  textBotonModalProgramadas: {
    color: colors.blanco,
    fontSize: 24,
    fontWeight: "bold",
  },
  modalTitleProgramadas: {
    color: colors.primario,
    fontSize: 24,
  },
  inputModalContainer: {
    flexDirection: "row",
    padding: 16,
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
