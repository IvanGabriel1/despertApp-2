import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { useContext, useState, useEffect, useRef } from "react";
import { colors } from "../Global/colors";
import { AlarmaContext } from "../Context/AlarmaContext";

const ModalAlarma = () => {
  const [hora, setHora] = useState("");
  const [minutos, setMinutos] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [lunes, setLunes] = useState(false);
  const [martes, setMartes] = useState(false);
  const [miercoles, setMiercoles] = useState(false);
  const [jueves, setJueves] = useState(false);
  const [viernes, setViernes] = useState(false);
  const [sabado, setSabado] = useState(false);
  const [domingo, setDomingo] = useState(false);

  const [botonSoloUnaVez, setBotonSoloUnaVez] = useState(true);

  const minutosRef = useRef(null);

  useEffect(() => {
    console.log("Nuevo estado de creandoAlarma:", creandoAlarma);
  }, [creandoAlarma]);

  useEffect(() => {
    console.log("Alarmas programadas:", alarmasProgramadas);
  }, [alarmasProgramadas]);

  const {
    isOpenModal,
    setIsOpenModal,
    cerrarModal,
    creandoAlarma,
    setCreandoAlarma,
    setAlarmasProgramadas,
    alarmasProgramadas,
    agregarAlarma,
  } = useContext(AlarmaContext);

  const guardarAlarma = async () => {
    if (hora === "" || minutos === "") {
      alert("Tenes que completar la hora y minutos");
      return;
    }

    const diasArray = [];
    if (lunes) diasArray.push("Lunes");
    if (martes) diasArray.push("Martes");
    if (miercoles) diasArray.push("Miercoles");
    if (jueves) diasArray.push("Jueves");
    if (viernes) diasArray.push("Viernes");
    if (sabado) diasArray.push("Sabado");
    if (domingo) diasArray.push("Domingo");

    if (!botonSoloUnaVez && diasArray.length === 0) {
      alert(
        "Debes elegir por lo menos 1 dia, o seleccionar la opcion `Solo una vez` ",
      );
      return;
    }

    const h = hora.toString().padStart(2, "0");
    const m = minutos.toString().padStart(2, "0");

    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      alert("Hora inválida. Usa formato 24h (00–23) y minutos (00–59)");
      return;
    }

    if (mensaje.length > 50) {
      alert("El mensaje tiene que tener menos de 50 caracterés");
      return;
    }

    if (
      mensaje === "" ||
      mensaje === " " ||
      mensaje === null ||
      mensaje === undefined
    ) {
      setMensaje("Sin mensaje");
    }

    const nuevaAlarma = {
      id: `alarma-${Date.now()}`,
      hora: h,
      minutos: m,
      dias: diasArray,
      unavez: botonSoloUnaVez,
      mensaje,
    };

    setIsOpenModal(!isOpenModal);
    console.log("nuevaAlarma:", nuevaAlarma);
    await agregarAlarma(nuevaAlarma);

    resetInputs();
    alert(`Mensaje programado a las ${h}:${m} : ${mensaje}`);
  };

  const resetInputs = () => {
    setHora("");
    setMinutos("");
    setBotonSoloUnaVez(true);
    setLunes(false);
    setMartes(false);
    setMiercoles(false);
    setJueves(false);
    setViernes(false);
    setSabado(false);
    setDomingo(false);
    setMensaje("");
  };

  const handleBotonUnaVez = () => {
    setBotonSoloUnaVez(!botonSoloUnaVez);
    setLunes(false);
    setMartes(false);
    setMiercoles(false);
    setJueves(false);
    setViernes(false);
    setSabado(false);
    setDomingo(false);
  };

  const handleOpenModal = () => {
    setIsOpenModal(!isOpenModal);
  };

  return (
    <Modal visible={isOpenModal} animationType="slide" transparent={false}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Creando Alarma:</Text>
          <View style={styles.inputModalContainer}>
            <TextInput
              value={hora}
              onChangeText={(text) => {
                if (text === "") {
                  setHora("");
                  return;
                }

                const num = parseInt(text, 10);

                if (isNaN(num)) return;

                if (num > 23) {
                  setHora("23");
                } else {
                  setHora(text);
                }

                if (text.length === 2) {
                  minutosRef.current?.focus();
                }
              }}
              keyboardType="numeric"
              maxLength={2}
              placeholder="HH"
              placeholderTextColor={colors.primario}
              style={styles.inputsModal}
            />
            <Text style={styles.inputsModalPuntos}>:</Text>
            <TextInput
              ref={minutosRef}
              value={minutos}
              onChangeText={(text) => {
                if (text === "") {
                  setMinutos("");
                  return;
                }

                const num = parseInt(text, 10);

                if (isNaN(num)) return;

                if (num > 59) {
                  setMinutos("59");
                } else {
                  setMinutos(text);
                }
              }}
              keyboardType="numeric"
              maxLength={2}
              placeholder="MM"
              placeholderTextColor={colors.primario}
              style={styles.inputsModal}
            />
          </View>
          <Pressable
            onPress={handleBotonUnaVez}
            style={
              botonSoloUnaVez
                ? styles.botonSoloUnaVez
                : styles.botonSoloUnaVezInactivo
            }
          >
            <Text style={styles.botonSoloUnaVezText}>Solo una vez</Text>
          </Pressable>
          {!botonSoloUnaVez && (
            <View style={styles.diasSemanaContainer}>
              <Pressable
                style={[styles.diaSemana, lunes && styles.diaSemanaActivo]}
                onPress={() => setLunes((prev) => !prev)}
              >
                <Text style={styles.diaSemanaText}>L</Text>
              </Pressable>

              <Pressable
                style={[styles.diaSemana, martes && styles.diaSemanaActivo]}
                onPress={() => setMartes((prev) => !prev)}
              >
                <Text style={styles.diaSemanaText}>M</Text>
              </Pressable>

              <Pressable
                style={[styles.diaSemana, miercoles && styles.diaSemanaActivo]}
                onPress={() => setMiercoles((prev) => !prev)}
              >
                <Text style={styles.diaSemanaText}>M</Text>
              </Pressable>
              <Pressable
                style={[styles.diaSemana, jueves && styles.diaSemanaActivo]}
                onPress={() => setJueves((prev) => !prev)}
              >
                <Text style={styles.diaSemanaText}>J</Text>
              </Pressable>
              <Pressable
                style={[styles.diaSemana, viernes && styles.diaSemanaActivo]}
                onPress={() => setViernes((prev) => !prev)}
              >
                <Text style={styles.diaSemanaText}>V</Text>
              </Pressable>
              <Pressable
                style={[styles.diaSemana, sabado && styles.diaSemanaActivo]}
                onPress={() => setSabado((prev) => !prev)}
              >
                <Text style={styles.diaSemanaText}>S</Text>
              </Pressable>
              <Pressable
                style={[styles.diaSemana, domingo && styles.diaSemanaActivo]}
                onPress={() => setDomingo((prev) => !prev)}
              >
                <Text style={styles.diaSemanaText}>D</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.modalTitle2}>Mensaje:</Text>
          <View style={styles.textInputMensajeContainer}>
            <TextInput
              style={styles.mensajeTextInput}
              placeholder="Escribe un mensaje"
              value={mensaje}
              onChangeText={setMensaje}
            />
          </View>

          <Pressable onPress={handleOpenModal} style={styles.botonCerrarModal}>
            <Text style={styles.textBotonModal}>X</Text>
          </Pressable>
          <Pressable onPress={guardarAlarma} style={styles.botonGuardar}>
            <Text style={styles.botonGuardarText}>Guardar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default ModalAlarma;

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: colors.primarioAlphaColor50,
    height: "100%",
  },
  modalContainer: {
    marginTop: "auto",
    marginBottom: "auto",
    marginLeft: 32,
    marginRight: 32,
    padding: 16,
    width: "90%",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.primario,
    backgroundColor: colors.fondo,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  botonCerrarModal: {
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
  textBotonModal: {
    color: colors.blanco,
    fontSize: 24,
    fontWeight: "bold",
  },
  modalTitle: {
    color: colors.primario,
    fontSize: 24,
  },
  modalTitle2: {
    color: colors.primario,
    fontSize: 20,
  },
  inputModalContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputsModal: {
    fontSize: 72,
    color: colors.primario,
    textDecorationLine: "underline",
  },
  inputsModalPuntos: {
    fontSize: 72,
    color: colors.primario,
  },
  botonSoloUnaVezText: {
    alignSelf: "center",
    margin: "auto",
    color: colors.blanco,
    fontSize: 20,
    fontWeight: 800,
  },
  botonSoloUnaVez: {
    backgroundColor: colors.primario,
    width: "100%",
    maxWidth: 250,
    height: 32,
    borderRadius: 16,
    marginBottom: 16,
  },
  botonSoloUnaVezInactivo: {
    backgroundColor: colors.primarioAlphaColor50,
    width: "100%",
    maxWidth: 250,
    height: 32,
    borderRadius: 16,
    marginBottom: 16,
  },
  diasSemanaContainer: {
    flexDirection: "row",
    justifyContent: "center",
    maxWidth: 300,
    flexWrap: "wrap",
    marginTop: 16,
    marginBottom: 16,
  },
  diaSemana: {
    width: 60,
    height: 60,
    justifyContent: "center",
    backgroundColor: colors.primarioAlphaColor50,
    borderColor: colors.primario,
    borderWidth: 1,
  },
  diaSemanaText: {
    alignSelf: "center",
    color: colors.blanco,
    fontSize: 24,
  },
  diaSemanaActivo: {
    backgroundColor: colors.primario,
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
  textInputMensajeContainer: {
    borderColor: colors.primario,
    borderWidth: 1,
    borderRadius: 16,
    width: "80%",
    margin: 16,
    height: 80,
    alignItems: "center",
  },
});
