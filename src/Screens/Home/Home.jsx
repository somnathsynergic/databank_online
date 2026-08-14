import {
  StyleSheet,
  Text,
  View,
  PixelRatio,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { useState, useEffect, useContext, useCallback } from "react"
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import { icon } from "../../Resources/Icons"
import { Table, Rows, Row } from "react-native-table-component"
import { COLORS, colors } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import { AppStore } from "../../Context/AppContext"
import { Button } from "react-native"
import mainNavigationRoutes from "../../Routes/NavigationRoutes"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import FindAccountScreen from "../FindAccountScreen/FindAccountScreen"
import FindLoanAccountScreen from "../FindAccountScreen/FindLoanAccountScreen"
import FindRDAccount from "../FindAccountScreen/FindRDAccount"
import { REACT_APP_BASE_URL, IMG_URL } from "../../Config/config"
import { getBase64FromUrl } from "../../Functions/getBase64FromUrl"

mainNavigationRoutes
// import { useIsFocused } from '@react-navigation/native';
const Home = ({ navigation }) => {
  const {
    userId,
    agentName,
    bankName,
    branchName,
    totalCollection,
    getTotalDepositAmount,
    login,
    isLoan,
    isRD,
    isDaily,
    logo_path,
  } = useContext(AppStore)

  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  const [refreshing, setRefreshing] = useState(false)
  // console.log('three options: '+isLoan,isDaily,isRD)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  let bank = [[bankName]]
  // useEffect(())
  let tableData = [
    // ["Bank", bankName],
    ["Branch", branchName],
    ["Agent Code", userId],
    ["Agent Name", agentName],
    ["Date", currentDateTime.toLocaleDateString("en-GB")],
    ["Time", currentDateTime.toLocaleTimeString("en-GB")],
    ["Total Collection", totalCollection.toFixed(2)],
  ]

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    getTotalDepositAmount()
    setTimeout(() => {
      setRefreshing(false)
      login()
    }, 2000)
  }, [])



  useFocusEffect(
    useCallback(() => {
      // alert('Screen was focused')
      setRefreshing(true)
      getTotalDepositAmount()
      setTimeout(() => {
        setRefreshing(false)
        login()
      }, 2000)

      // navigation.dispatch(popAction) // removed to avoid POP_TO_TOP warning

      return () => {
        // alert('Screen was unfocused')
        // // Useful for cleanup functions
      }
    }, []),
  )

  async function printAgentInfo() {
    try {
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      if (logo_path) {
        const _imgUrl = IMG_URL + logo_path
        const _imgBase64 = await getBase64FromUrl(_imgUrl)
        if (_imgBase64) {
          await BluetoothEscposPrinter.printPic(_imgBase64, {
            width: 150,
            align: "center",
            left: 15,
          })
          await BluetoothEscposPrinter.printText("\r\n", {})
        }
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printText(bankName, { align: "center" })
      await BluetoothEscposPrinter.printText("\r\n", {})
      await BluetoothEscposPrinter.printText(branchName, { align: "center" })
      await BluetoothEscposPrinter.printText("\r\n", {})

      await BluetoothEscposPrinter.printText("AGENT INFORMATION", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\r", {})
      await BluetoothEscposPrinter.printText(
        "-------------------------------",
        {},
      )
      await BluetoothEscposPrinter.printText("\r\n", {})

      await BluetoothEscposPrinter.printColumn(
        [30],
        [BluetoothEscposPrinter.ALIGN.LEFT],
        ["Agent Name: " + agentName],
        {},
      )

      await BluetoothEscposPrinter.printColumn(
        [30],
        [BluetoothEscposPrinter.ALIGN.LEFT],
        ["Agent Code: " + userId],
        {},
      )

      await BluetoothEscposPrinter.printColumn(
        [30],
        [BluetoothEscposPrinter.ALIGN.LEFT],
        ["Date: " + currentDateTime.toLocaleDateString("en-GB")],
        {},
      )

      await BluetoothEscposPrinter.printText("\r\n", {})

      await BluetoothEscposPrinter.printColumn(
        [40],
        [BluetoothEscposPrinter.ALIGN.LEFT],
        ["Total Collection: " + totalCollection + "/-"],
        {},
      )

      await BluetoothEscposPrinter.printText("\r", {})

      await BluetoothEscposPrinter.printBarCode(
        "My String Decode",
        BluetoothEscposPrinter.BARCODETYPE.JAN13,
        3,
        120,
        0,
        2,
      )
      await BluetoothEscposPrinter.printText("\r", {})

      // await BluetoothEscposPrinter.printQRCode("My String Decode", 280, BluetoothEscposPrinter.ERROR_CORRECTION.L)

      // await BluetoothEscposPrinter.printText("\r\n", {})
      await BluetoothEscposPrinter.printText(
        "---------------X---------------",
        {},
      )

      await BluetoothEscposPrinter.printText("\r\n\r\n\r\n", {})
      // await BluetoothEscposPrinter.printQRCode("Something", 25, 3)
    } catch (e) {
      // console.log(e.message || "ERROR")
      alert("Printer is not connected. Connect it from Settings.")
    }
  }
  const Stack = createNativeStackNavigator()

  return (
    <>
      {/* <Stack.Navigator screenOptions={{ headerShown: false }}>
     <Stack.Screen
          name={mainNavigationRoutes.home}
          component={}
        />
        <Stack.Screen
          name={mainNavigationRoutes.findAccount}
          component={FindAccountScreen}
        />
        <Stack.Screen
          name={mainNavigationRoutes.findLoanAccount}
          component={FindLoanAccountScreen}
        />
        <Stack.Screen
          name={mainNavigationRoutes.findRDAccount}
          component={FindRDAccount}
        />
      </Stack.Navigator> */}
      <View style={{ flex: 1 }}>
        <CustomHeader />

        <View style={styles.logoContainer}>
          <View style={{ width: "100%" }}>
            {/* Welcome gretting */}
            <Text style={styles.grettingText}>Welcome To {"Data Bank"}</Text>
            {/* manual text */}
            <Text style={styles.manual}>Hello, {agentName}</Text>
          </View>
        </View>
        {/* <View>
          <Text>  {IMG_URL + logo_path}  </Text>
                  <Image source={IMG_URL + logo_path} style={styles.image} resizeMode="contain" />
          
        </View> */}
        <View
          style={{
            flex: 4,
            padding: 10,
            backgroundColor: COLORS.lightScheme.background,
            margin: 20,
            borderRadius: 10,
          }}>
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                color={COLORS.lightScheme.primary}
                onRefresh={onRefresh}
              />
            }>
            <Text style={styles.todayCollection}>Agent Information</Text>
            <Table
              borderStyle={{
                borderWidth: 2,
                borderColor: COLORS.lightScheme.primary,
                borderRadius: 15,
              }}
              style={{
                backgroundColor: COLORS.lightScheme.background,
              }}>
              <Row data={bank} textStyle={styles.bnk} />
              <Rows data={tableData} textStyle={styles.text} />
            </Table>

            <View style={styles.options}>
              <TouchableOpacity
                disabled={!isDaily}
                style={styles.cardContainer}
                onPress={() => navigation.navigate("Daily_Navigation")}>
                {/* Icon */}
                {icon.daily(
                  isDaily
                    ? COLORS.lightScheme.primary
                    : COLORS.lightScheme.secondary,
                  25,
                )}

                {/* label */}
                <Text style={isDaily ? styles.label : styles.disabledContainer}>
                  {" "}
                  Daily{" "}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!isLoan}
                onPress={() => navigation.navigate("Loan_Navigation")}
                style={styles.cardContainer}>
                {/* Icon */}
                {icon.giver(
                  isLoan
                    ? COLORS.lightScheme.primary
                    : COLORS.lightScheme.secondary,
                  25,
                )}

                {/* label */}
                <Text style={isLoan ? styles.label : styles.disabledContainer}>
                  {" "}
                  Loan{" "}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!isRD}
                onPress={() => navigation.navigate("RD_Navigation")}
                style={styles.cardContainer}>
                {/* Icon */}
                {icon.loop(
                  isRD
                    ? COLORS.lightScheme.primary
                    : COLORS.lightScheme.secondary,
                  25,
                )}

                {/* label */}
                <Text style={isRD ? styles.label : styles.disabledContainer}>
                  {" "}
                  RD{" "}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          {/* <View style={styles.printAgent}>
            <Button
              title="Print"
              color={COLORS.lightScheme.tertiary}
              onPress={printAgentInfo}
            />
          </View> */}
        </View>
      </View>
    </>
  )
}

export default Home

const styles = StyleSheet.create({
  head: { height: 40, backgroundColor: "#f1f8ff" },
  text: {
    margin: 6,
    color: COLORS.lightScheme.onPrimaryContainer,
    fontWeight: "400",
    fontSize: 18,
  },
  card: {
    border: COLORS.lightScheme.primary,
    borderWidth: 1,
  },
  bnk: {
    margin: 6,
    color: COLORS.lightScheme.primary,
    fontWeight: "900",
    fontSize: 18,
  },
  logoContainer: {
    flex: 1,
    backgroundColor: COLORS.lightScheme.primary,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  grettingText: {
    fontSize: 20,
    color: COLORS.lightScheme.onPrimary,
    letterSpacing: 1,
    fontWeight: "900",
    alignSelf: "center",
  },
  manual: {
    fontSize: 16,
    color: COLORS.lightScheme.onPrimary,
    letterSpacing: 1,
    fontWeight: "900",
    alignSelf: "center",
  },
  todayCollection: {
    backgroundColor: COLORS.lightScheme.primary,
    color: COLORS.lightScheme.onPrimary,
    fontWeight: "600",
    textAlign: "center",
    fontSize: PixelRatio.roundToNearestPixel(22),
    padding: PixelRatio.roundToNearestPixel(5),
    marginBottom: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  printAgent: {
    margin: 5,
    paddingTop: 3,
  },
  cardContainer: {
    backgroundColor: COLORS.lightScheme.onPrimary,
    alignItems: "center",
    width: "25%",
    height: 70, //
    padding: 6,
    paddingTop: 20,
    margin: 5,
    paddingBottom: 5,
    marginTop: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    justifyContent: "center",
    borderColor: COLORS.lightScheme.primary,
    borderWidth: 3,
    elevation: 30,
  },
  label: {
    color: COLORS.lightScheme.primary,
    padding: 10,
    textAlign: "center",
    fontSize: PixelRatio.roundToNearestPixel(13),
    fontWeight: "bold",
  },
  options: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.lightScheme.tertiaryContainer,
    // alignSelf: 'center',
    letterSpacing: 4,
    backgroundColor: COLORS.lightScheme.primary,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderTopLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  disabledContainer: {
    color: "gray",
  },
   image: {
    width: 150,
    height: 150,
  },
})
