import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
  Pressable,
  ToastAndroid,
  ActivityIndicator,
} from "react-native"
import { useContext, useEffect, useState } from "react"
import { COLORS, colors } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import {
  Table,
  TableWrapper,
  Row,
  Rows,
  Col,
} from "react-native-table-component"
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import InputComponent from "../../Components/InputComponent"
import ButtonComponent from "../../Components/ButtonComponent"
import axios from "axios"
import { AppStore } from "../../Context/AppContext"
import { REACT_APP_BASE_URL, IMG_URL } from "../../Config/config"
import mainNavigationRoutes from "../../Routes/NavigationRoutes"
import { StackActions } from "@react-navigation/native"
import { address } from "../../Routes/addresses"
import { getBase64FromUrl } from "../../Functions/getBase64FromUrl"
import { logo } from "../../Resources/ImageStrings/logo"
import { gle } from "../../Resources/ImageStrings/gle"
import { glej } from "../../Resources/ImageStrings/glej"
import { Alert } from "react-native"
import CancelButtonComponent from "../../Components/CancelButtonComponent"
// import logoCut from "../../Resources/Images/logo_cut.png"

const LoanAccountPreviewScreen = ({ navigation, route }) => {
  const [receiptNumber, setReceiptNumber] = useState(() => "")
  const [isSaveEnabled, setIsSaveEnabled] = useState(() => false)
  const [isLoading, setLoading] = useState(false)
  var todayDT

  const {
    id,
    userId,
    maximumAmount,
    getTotalDepositAmount,
    totalDepositedAmount,
    todayDateFromServer,
    agentName,
    bankName,
    branchName,
    totalCollection,
    login,
    secAmtType,
    bankId,
    branchCode,
    printOp,
    logo_path,
  } = useContext(AppStore)
  const { item, money } = route.params

  const [lastTnxDate, setLastTnxDate] = useState(() => "")
  // const [addedMoney, setAddedMoney] = useState(() => 0)

  const tableData = [
    [
      "A/c Type",
      item?.acc_type == "D"
        ? "Daily"
        : item?.acc_type == "R"
          ? "RD"
          : item?.acc_type == "L"
            ? "Loan"
            : "",
    ],
    ["A/c No.", item?.account_number],
    ["Name", item?.customer_name],
    ["Mobile No.", item?.mobile_no],
    ["Opening Date", new Date(item?.opening_date).toLocaleDateString("en-GB")],
    [
      "Previous Transaction Date",
      lastTnxDate
        ? new Date(lastTnxDate).toLocaleDateString("en-GB")
        : "No available date",
    ],
    ["Previous Balance", item?.current_balance],
  ]

  const netTotalSectionTableData = [
    ["Tnx. Date", new Date(todayDateFromServer).toLocaleDateString("en-GB")],
    ["Deposit Amt.", money],
    ["Current Balance", +item?.current_balance - parseFloat(money)],
  ]

  const resetAction = StackActions.popToTop()

  const getLastTnxDate = async () => {
    const obj = {
      bank_id: bankId,
      branch_code: branchCode,
      agent_code: userId,
      account_number: item?.account_number,
      flag: "L",
    }

    console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOO", obj)

    await axios
      .post(address.LAST_TNX_DATE, obj, {
        headers: {
          Accept: "application/json",
        },
      })
      .then(res => {
        setLastTnxDate(
          res?.data?.success?.length !== 0
            ? res?.data?.success?.msg[0]?.last_trns_dt?.toString()
            : "",
        )

        // {"status": true, "success": []}
        console.log(
          ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
          res?.data?.success?.msg[0]?.last_trns_dt,
        )
      })
      .catch(err => {
        console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<", err)
      })
  }

  useEffect(() => {
    getLastTnxDate()
  }, [])

  const sendCollectedMoney = async () => {
    setLoading(true)
    todayDT = new Date().toISOString()
    const obj = {
      bank_id: item?.bank_id,
      branch_code: item?.branch_code,
      agent_code: userId,
      account_holder_name: item?.customer_name,
      transaction_date: todayDT,
      account_type: item?.acc_type,
      product_code: item?.product_code,
      account_number: item?.account_number,
      total_amount: +item?.current_balance - parseFloat(money),
      deposit_amount: parseFloat(money),
      collection_by: id,
      sec_amt_type: secAmtType,
      total_collection_amount: totalCollection,
      // flag:'L'
    }
    console.log("===========", obj)
    await axios
      .post(address.TRANSACTION, obj, {
        headers: {
          Accept: "application/json",
        },
      })
      // .then(res => {
      //   console.log("###### Preview: ", res.data)
      //   // alert(`Receipt No is ${res.data.receipt_no}`)
      //   Alert.alert("Receipt No.", `Receipt No is ${res.data.receipt_no}`, [
      //     {
      //       text: "Okay",
      //       onPress: () => console.log("Receipt generated."),
      //     }
      //   ])
      //   setReceiptNumber(res.data.receipt_no)
      //   setIsSaveEnabled(false)
      //   printReceipt(res.data.receipt_no)
      //   navigation.dispatch(resetAction)
      // })
      .then(res => {
        console.log("result " + res.data.status)
        if (res.data.status) {
          setLoading(false)

          // console.log("###### Preview: ", res.data)
          // alert(`Receipt No is ${res.data.receipt_no}`)
          Alert.alert("Receipt No.", `Receipt No is ${res.data.receipt_no}`, [
            {
              text: "Okay",
              onPress: () => console.log("Receipt generated."),
            },
          ])
          setReceiptNumber(res.data.receipt_no)
          setIsSaveEnabled(false)
          printReceipt(res.data.receipt_no)
          navigation.dispatch(resetAction)
        } else {
          setLoading(false)

          alert("Data already submitted. Please upload new dataset.")
          ToastAndroid.showWithGravityAndOffset(
            "Data already submitted. Please upload new dataset.",
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
            25,
            50,
          )
        }
      })
      .catch(err => {
        setLoading(false)

        alert(`An error occurred! ${err}`)
        ToastAndroid.showWithGravityAndOffset(
          err,
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        )
      })
  }

  async function printReceipt(rcptNo) {
    if (printOp == 2) {
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
        await BluetoothEscposPrinter.printText(bankName + '\r\n', { align: "center" })
        // await BluetoothEscposPrinter.printText("\r\n", {})
        await BluetoothEscposPrinter.printText(branchName + '\r\n', { align: "center" })
        // await BluetoothEscposPrinter.printText("\r\n", {})

        await BluetoothEscposPrinter.printText("CUSTOMER RECEIPT\n", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\r\n", {})

        await BluetoothEscposPrinter.printText(
          "-------------------------------\n",
          {},
        )
        // await BluetoothEscposPrinter.printText("\r\n", {})

        await BluetoothEscposPrinter.printColumn(
          [30],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["RCPT. No. : " + rcptNo],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [30],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["Acc. No. : " + item?.account_number],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [30],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["Name: " + item?.customer_name],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [30],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["Previous Bal. : " + item?.current_balance],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [30],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["Deposit Amt. : " + money],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [30],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          [
            "Current Bal. : " +
            parseFloat(+item?.current_balance - parseFloat(money)),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [30],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          [
            "Tnx. Datetime: " +
            new Date(todayDT).toLocaleDateString("en-GB") +
            ", " +
            new Date(todayDT).toLocaleTimeString("en-GB"),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [30],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          [
            "PRV TNX DT : " + lastTnxDate
              ? new Date(lastTnxDate)
                .toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })
                .toString()
              : "No date.",
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [30],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["Collected By (Code) : " + userId],
          {},
        )

        // await BluetoothEscposPrinter.printText("\r\n", {})

        // await BluetoothEscposPrinter.printText("\r\n", {})
        await BluetoothEscposPrinter.printText(
          "---------------X---------------\n\n",
          {},
        )

        // await BluetoothEscposPrinter.printText("\r\n", {})
      } catch (e) {
        console.log(e.message || "ERROR")
        // ToastAndroid.showWithGravityAndOffset(
        //   "Printer not connected.",
        //   ToastAndroid.SHORT,
        //   ToastAndroid.CENTER,
        //   25,
        //   50,
        // )
      }
    } else if (printOp == 3) {
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
              left: 80,
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

        await BluetoothEscposPrinter.printText("CUSTOMER RECEIPT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\r", {})

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------",
          {},
        )
        await BluetoothEscposPrinter.printText("\r\n", {})

        await BluetoothEscposPrinter.printColumn(
          [48],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["RCPT. No. : " + rcptNo],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [48],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["Acc. No. : " + item?.account_number],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [48],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["Name: " + item?.customer_name],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [48],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["Previous Bal. : " + item?.current_balance],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [48],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["Deposit Amt. : " + money],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [48],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          [
            "Current Bal. : " +
            parseFloat(+item?.current_balance - parseFloat(money)),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [48],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          [
            "Tnx. Datetime: " +
            new Date(todayDT).toLocaleDateString("en-GB") +
            ", " +
            new Date(todayDT).toLocaleTimeString("en-GB"),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [48],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          [
            "PRV TNX DT : " + lastTnxDate
              ? new Date(lastTnxDate)
                .toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })
                .toString()
              : "No date.",
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          [48],
          [BluetoothEscposPrinter.ALIGN.LEFT],
          ["Collected By (Code) : " + userId],
          {},
        )

        // await BluetoothEscposPrinter.printText("\r\n", {})

        // await BluetoothEscposPrinter.printText("\r\n", {})
        await BluetoothEscposPrinter.printText(
          "----------------------X----------------------",
          {},
        )

        await BluetoothEscposPrinter.printText("\r\n", {})
      } catch (e) {
        console.log(e.message || "ERROR")
        // ToastAndroid.showWithGravityAndOffset(
        //   "Printer not connected.",
        //   ToastAndroid.SHORT,
        //   ToastAndroid.CENTER,
        //   25,
        //   50,
        // )
      }
    } else {
      ToastAndroid.showWithGravityAndOffset(
        "Invalid printer option selected.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      )
    }
  }

  const handleSave = () => {
    getTotalDepositAmount()
    console.log("##$$$$###$$$", maximumAmount, money, totalDepositedAmount)
    console.log("##$$$$+++++###$$$", money + totalDepositedAmount)
    console.log("##$$$$+++++###$$$", typeof money, typeof totalDepositedAmount,typeof maximumAmount)
    console.log("##$$$$+++++###$$$", parseFloat(money) + totalDepositedAmount)
    if (+(maximumAmount) >=parseFloat(money) + (+totalDepositedAmount)) {
      setIsSaveEnabled(true)
      sendCollectedMoney()
    } else {
      ToastAndroid.showWithGravityAndOffset(
        "Your collection quota has been exceeded.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      )
    }
  }

  // useEffect(() => {
  //   getTotalDepositAmount()
  // }, [])

  // const sendFinalCollectedMoney = () => {
  //   getTotalDepositAmount()

  //   console.log("Total Deposited Amount", totalDepositedAmount)
  // }

  return (
    <View>
      <CustomHeader />
      <View
        style={{
          backgroundColor: COLORS.lightScheme.background,
          height: "100%",
          padding: 10,
        }}>
        <ScrollView>
          <Text style={styles.info}>Preview</Text>
          {/* Table Component */}
          <View style={styles.tableConatiner}>
            <Table
              borderStyle={{
                borderWidth: 5,
                borderColor: COLORS.lightScheme.primary,
              }}
              style={{ backgroundColor: COLORS.lightScheme.onTertiary }}>
              <Rows data={tableData} textStyle={styles.text} />
            </Table>
          </View>

          {/* <View style={styles.netTotalTableContainer}>
              <Table
                borderStyle={{ borderWidth: 0, borderColor: COLORS.lightScheme.primary,  }}
                style={{ backgroundColor: COLORS.lightScheme.onTertiary }}>
                <Rows data={netTotalSectionTableData} textStyle={styles.netTotalText} />
              </Table>
            </View> */}

          <View style={styles.inputContainer}>
            <View style={styles.netTotalTableContainer}>
              <Table
                borderStyle={{
                  borderWidth: 1,
                  borderColor: COLORS.lightScheme.primary,
                }}
                style={{
                  backgroundColor: COLORS.lightScheme.secondaryContainer,
                }}>
                <Rows
                  data={netTotalSectionTableData}
                  textStyle={styles.netTotalText}
                />
              </Table>
            </View>
            {/* Input Field */}
            <View style={styles.buttonContainer}>
              <CancelButtonComponent
                title={"Back"}
                customStyle={{
                  marginTop: 10,
                  marginRight: 10,
                  backgroundColor: "white",
                  colors: "red",
                  width: "40%",
                }}
                handleOnpress={() => {
                  navigation.goBack()
                }}
              />
              <ButtonComponent
                title={
                  !isLoading ? (
                    "Save"
                  ) : (
                    <ActivityIndicator color={COLORS.lightScheme.primary} />
                  )
                }
                customStyle={{ marginTop: 10, width: "40%" }}
                handleOnpress={() => {
                  handleSave()
                }}
                disabled={isLoading}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

export default LoanAccountPreviewScreen

const styles = StyleSheet.create({
  text: {
    margin: 6,
    color: COLORS.lightScheme.onBackground,
    fontWeight: "400",
    fontSize: 18,
  },
  netTotalTableContainer: {
    padding: 10,
    // backgroundColor: COLORS.lightScheme.primary,
    borderRadius: 15,
  },
  netTotalText: {
    margin: 6,
    color: "teal",
    // fontWeight: 'bold',
    fontSize: 18,
  },
  inputContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: COLORS.lightScheme.secondaryContainer,
    borderRadius: 5,
  },
  info: {
    color: COLORS.lightScheme.onPrimary,
    textAlign: "center",
    fontSize: 22,
    letterSpacing: 5,
    backgroundColor: COLORS.lightScheme.primary,
    borderRadius: 5,
    marginBottom: 5,
    paddingVertical: 5,
    fontWeight: "600",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  buttonContainer: {
    marginVertical: 10,
    // padding: 10,
    paddingTop: -5,
    backgroundColor: COLORS.darkScheme.onSecondaryContainer,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tableConatiner: {
    padding: 10,
    backgroundColor: COLORS.lightScheme.onTertiary,
    borderRadius: 5,
  },
})
