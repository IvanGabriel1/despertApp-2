import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useContext, useRef, useState, useEffect } from "react";
import { colors } from "../Global/colors";
import { AlarmaContext } from "../Context/AlarmaContext";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AlarmasProgramadas = () => {
  const [isOpenModalProgramadas, setIsOpenModalProgramadas] = useState(false);
  const [alarmaSeleccionada, setAlarmaSeleccionada] = useState(null);
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
    alarmasProgramadas,
    borrarItemAlarma,
    setAlarmasProgramadas,
    programarNotificacion,
    cancelarNotificacion,
    cerrarModal,
    programarNotificacionPorDias,
    cancelarNotificacionesPorDias,
  } = useContext(AlarmaContext);
  const minutosRef = useRef(null);

  const diasIguales = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((dia) => b.includes(dia));
  };

  const alarmasProgramadasDias = alarmasProgramadas
    .filter((item) => item.unavez === false)
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
          (t) =>
            t.hora === item.hora &&
            t.minutos === item.minutos &&
            diasIguales(t.dias, item.dias),
        )
      );
    });

  const btnEditar = (item) => {
    setAlarmaSeleccionada(item);
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
    setAlarmaSeleccionada(null);
    setNuevaMensaje(null);
    setDiasSeleccionados([]);
  };

  const guardarCambios = async () => {
    try {
      console.log("🧠 guardarCambios ejecutado", {
        nuevaHora,
        nuevaMinutos,
        nuevaMensaje,
        diasSeleccionados,
      });
      if (!alarmaSeleccionada) return;

      let horaFinal =
        nuevaHora && nuevaHora.trim() !== ""
          ? nuevaHora
          : alarmaSeleccionada.hora;
      let minutosFinal =
        nuevaMinutos && nuevaMinutos.trim() !== ""
          ? nuevaMinutos
          : alarmaSeleccionada.minutos;

      if (!horaFinal || !minutosFinal) {
        alert("La alarma debe tener hora y minutos");
        return;
      }

      let mensajeFinal =
        nuevaMensaje !== null ? nuevaMensaje : alarmaSeleccionada.mensaje;

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

      console.log("➡️ antes de cancelar");
      if (alarmaSeleccionada.notificationIds) {
        await cancelarNotificacionesPorDias(alarmaSeleccionada.notificationIds);
      }
      console.log("➡️ despues de cancelar");

      const notificationIds = await programarNotificacionPorDias({
        ...alarmaSeleccionada,
        hora: horaFinal,
        minutos: minutosFinal,
        dias: nuevosDias,
        mensaje: mensajeFinal,
      });
      console.log("➡️ despues de programar");
      console.log("✅ ids generados", notificationIds);

      const alarmaActualizada = {
        ...alarmaSeleccionada,
        hora: horaFinal,
        minutos: minutosFinal,
        dias: nuevosDias,
        unavez: false,
        mensaje: mensajeFinal,
        notificationIds,
      };

      setAlarmasProgramadas((prev) =>
        prev.map((item) =>
          item.id === alarmaSeleccionada.id ? alarmaActualizada : item,
        ),
      );

      btnCerrarModalUnaVez();

      alert(`Alarma actualizada a ${horaFinal}:${minutosFinal}`);
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
          data={alarmasProgramadasDias}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.listaAlarmasDeUnaVezItem}>
              <View style={styles.alarmasDeUnaVezHyMItem}>
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

              <View style={styles.alarmasDeUnaVezContenedorBotones}>
                <Pressable
                  style={styles.notificacionesProgramadasBorrar}
                  onPress={async () => {
                    if (item.notificationIds) {
                      await cancelarNotificacionesPorDias(item.notificationIds);
                    }
                    borrarItemAlarma(item);
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
            <Text style={styles.modalTitleProgramadas}>Modificar Alarma:</Text>

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

export default AlarmasProgramadas;

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
    marginBottom: 16,
  },
  listaNotificacionesProgramadasContainer: {
    borderRadius: 20,
    backgroundColor: colors.blanco,
    width: 350,
    marginBottom: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  alarmasDeUnaVezContenedorBotones: {
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
