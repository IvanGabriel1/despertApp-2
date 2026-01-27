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

  const [lunes, setLunes] = useState(false);
  const [martes, setMartes] = useState(false);
  const [miercoles, setMiercoles] = useState(false);
  const [jueves, setJueves] = useState(false);
  const [viernes, setViernes] = useState(false);
  const [sabado, setSabado] = useState(false);
  const [domingo, setDomingo] = useState(false);

  const {
    alarmasProgramadas,
    borrarItemAlarma,
    setAlarmasProgramadas,
    programarNotificacion,
    cancelarNotificacion,
    cerrarModal,
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
    setIsOpenModalProgramadas(true);
    obtenerDiasSemana(item);
  };

  const obtenerDiasSemana = (item) => {
    if (item.dias.includes("Lunes")) setLunes(true);
    if (item.dias.includes("Martes")) setMartes(true);
    if (item.dias.includes("Miercoles")) setMiercoles(true);
    if (item.dias.includes("Jueves")) setJueves(true);
    if (item.dias.includes("Viernes")) setViernes(true);
    if (item.dias.includes("Sabado")) setSabado(true);
    if (item.dias.includes("Domingo")) setDomingo(true);
  };

  const btnCerrarModalUnaVez = () => {
    setIsOpenModalProgramadas(false);

    setNuevaHora(null);
    setNuevaMinutos(null);
    setAlarmaSeleccionada(null);

    setLunes(false);
    setMartes(false);
    setMiercoles(false);
    setJueves(false);
    setViernes(false);
    setSabado(false);
    setDomingo(false);
  };

  const guardarCambios = async () => {
    if (!alarmaSeleccionada) return;

    if (nuevaHora === "" || nuevaMinutos === "") {
      alert(
        "No se puede guardar una alarma vacía. Completá la hora y los minutos.",
      );
      return;
    }

    let horaFinal =
      nuevaHora && nuevaHora.trim() !== ""
        ? nuevaHora
        : alarmaSeleccionada.hora;
    let minutosFinal =
      nuevaMinutos && nuevaMinutos.trim() !== ""
        ? nuevaMinutos
        : alarmaSeleccionada.minutos;

    let mensajeFinal =
      nuevaMensaje !== null ? nuevaMensaje : alarmaSeleccionada.mensaje;

    // formatear a dos dígitos
    if (horaFinal?.length === 1) horaFinal = horaFinal.padStart(2, "0");
    if (minutosFinal?.length === 1)
      minutosFinal = minutosFinal.padStart(2, "0");

    // guardar cambios realizados en los dias:
    const nuevosDias = [];
    if (lunes) nuevosDias.push("Lunes");
    if (martes) nuevosDias.push("Martes");
    if (miercoles) nuevosDias.push("Miercoles");
    if (jueves) nuevosDias.push("Jueves");
    if (viernes) nuevosDias.push("Viernes");
    if (sabado) nuevosDias.push("Sabado");
    if (domingo) nuevosDias.push("Domingo");

    if (alarmaSeleccionada.notificationId) {
      await cancelarNotificacion(alarmaSeleccionada.notificationId);
    }

    const notificationId = await programarNotificacion({
      ...alarmaSeleccionada,
      hora: horaFinal,
      minutos: minutosFinal,
      unavez: false,
      dias: nuevosDias,
      mensaje: mensajeFinal,
    });

    const alarmaActualizada = {
      ...alarmaSeleccionada,
      hora: horaFinal,
      minutos: minutosFinal,
      dias: nuevosDias,
      unavez: false,
      mensaje: mensajeFinal,
      notificationId,
    };

    setAlarmasProgramadas((prev) =>
      prev.map((item) =>
        item.id === alarmaSeleccionada.id ? alarmaActualizada : item,
      ),
    );

    // setAlarmasProgramadas((prev) => {
    //   const actualizadas = prev.map((item) =>
    //     item.id === alarmaSeleccionada.id
    //       ? {
    //           ...item,
    //           hora: horaFinal,
    //           minutos: minutosFinal,
    //           sonido: sonidoFinal,
    //           dias: nuevosDias,
    //           notificationId,
    //           mensaje: mensajeFinal,
    //         }
    //       : item,
    //   );

    //   const unicas = actualizadas.filter(
    //     (item, index, self) =>
    //       index ===
    //       self.findIndex(
    //         (t) =>
    //           t.hora === item.hora &&
    //           t.minutos === item.minutos &&
    //           t.unavez === item.unavez &&
    //           t.mensaje === item.mensaje &&
    //           diasIguales(t.dias, item.dias),
    //       ),
    //   );

    //   return unicas;
    // });
    btnCerrarModalUnaVez();

    alert(`Alarma actualizada a ${horaFinal}:${minutosFinal}`);
  };

  useEffect(() => {
    AsyncStorage.setItem(
      "alarmasProgramadas",
      JSON.stringify(alarmasProgramadas),
    )
      .then(() => console.log("✅ Alarmas guardadas en AsyncStorage"))
      .catch((err) => console.log("❌ Error guardando alarmas:", err));
  }, [alarmasProgramadas]);

  return (
    <SafeAreaView style={styles.alarmasDeUnaVezContainer}>
      <Text style={styles.alarmasDeUnaVezTitle}>
        Notificaciones Programadas:
      </Text>
      <View style={styles.listaAlarmasDeUnaVezContainer}>
        <FlatList
          data={alarmasProgramadasDias}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.listaAlarmasDeUnaVezItem}>
              <View style={styles.alarmasDeUnaVezHyMItem}>
                <Text style={styles.alarmasDeUnaVezHora}>{item.hora}</Text>
                <Text style={styles.alarmasDeUnaVezPuntos}>:</Text>
                <Text style={styles.alarmasDeUnaVezMinutos}>
                  {item.minutos}
                </Text>
              </View>

              <View style={styles.diasViewContainer}>
                <View style={styles.diasContainer}>
                  <View
                    style={[
                      styles.diaView,
                      item.dias.includes("Lunes") && styles.diaSemanaActivo,
                    ]}
                  >
                    <Text style={styles.diaPressableText}>L</Text>
                  </View>
                  <View
                    style={[
                      styles.diaView,
                      item.dias.includes("Martes") && styles.diaSemanaActivo,
                    ]}
                  >
                    <Text style={styles.diaPressableText}>M</Text>
                  </View>
                  <View
                    style={[
                      styles.diaView,
                      item.dias.includes("Miercoles") && styles.diaSemanaActivo,
                    ]}
                  >
                    <Text style={styles.diaPressableText}>M</Text>
                  </View>
                  <View
                    style={[
                      styles.diaView,
                      item.dias.includes("Jueves") && styles.diaSemanaActivo,
                    ]}
                  >
                    <Text style={styles.diaPressableText}>J</Text>
                  </View>
                  <View
                    style={[
                      styles.diaView,
                      item.dias.includes("Viernes") && styles.diaSemanaActivo,
                    ]}
                  >
                    <Text style={styles.diaPressableText}>V</Text>
                  </View>
                  <View
                    style={[
                      styles.diaView,
                      item.dias.includes("Sabado") && styles.diaSemanaActivo,
                    ]}
                  >
                    <Text style={styles.diaPressableText}>S</Text>
                  </View>
                  <View
                    style={[
                      styles.diaView,
                      item.dias.includes("Domingo") && styles.diaSemanaActivo,
                    ]}
                  >
                    <Text style={styles.diaPressableText}>D</Text>
                  </View>
                </View>
              </View>

              <View style={styles.alarmasProgramadasMensajeContainer}>
                <Text style={styles.alarmasProgramadasMensajeTexto}>
                  {item.mensaje}
                </Text>
              </View>

              <View style={styles.alarmasDeUnaVezContenedorBotones}>
                <Pressable
                  style={styles.alarmasDeUnaVezBorrar}
                  onPress={async () => {
                    if (item.notificationId) {
                      await cancelarNotificacion(item.notificationId);
                    }
                    borrarItemAlarma(item);
                  }}
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
              <Pressable
                style={[styles.diaView, lunes && styles.diaSemanaActivo]}
                onPress={() => setLunes(!lunes)}
              >
                <Text style={styles.diaPressableText}>L</Text>
              </Pressable>
              <Pressable
                style={[styles.diaView, martes && styles.diaSemanaActivo]}
                onPress={() => setMartes(!martes)}
              >
                <Text style={styles.diaPressableText}>M</Text>
              </Pressable>
              <Pressable
                style={[styles.diaView, miercoles && styles.diaSemanaActivo]}
                onPress={() => setMiercoles(!miercoles)}
              >
                <Text style={styles.diaPressableText}>M</Text>
              </Pressable>
              <Pressable
                style={[styles.diaView, jueves && styles.diaSemanaActivo]}
                onPress={() => setJueves(!jueves)}
              >
                <Text style={styles.diaPressableText}>J</Text>
              </Pressable>
              <Pressable
                style={[styles.diaView, viernes && styles.diaSemanaActivo]}
                onPress={() => setViernes(!viernes)}
              >
                <Text style={styles.diaPressableText}>V</Text>
              </Pressable>
              <Pressable
                style={[styles.diaView, sabado && styles.diaSemanaActivo]}
                onPress={() => setSabado(!sabado)}
              >
                <Text style={styles.diaPressableText}>S</Text>
              </Pressable>
              <Pressable
                style={[styles.diaView, domingo && styles.diaSemanaActivo]}
                onPress={() => setDomingo(!domingo)}
              >
                <Text style={styles.diaPressableText}>D</Text>
              </Pressable>
            </View>

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
    width: 50,
    height: 50,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.primario,
    margin: 6,
    backgroundColor: colors.primarioAlphaColor50,
  },
  diaPressableText: {
    margin: "auto",
    color: colors.blanco,
  },
  diaSemanaActivo: {
    backgroundColor: colors.primario,
  },
  alarmasProgramadasMensajeContainer: {},
  alarmasProgramadasMensajeTexto: {},
  textinputModalContainer: {},
  textinputModal: {},
  // Styles Modal:
  modalProgramadasContainer: {
    marginTop: 86,
    marginLeft: 32,
    marginRight: 32,
    marginBottom: 50,
    padding: 16,

    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.primario,
    backgroundColor: colors.fondo,
    justifyContent: "center",
    alignItems: "center",
    height: 500,
  },
  botonCerrarModalProgramadas: {
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
    padding: 6,
    paddingLeft: 10,
    paddingRight: 10,
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
