import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ToastAndroid,
  ActivityIndicator,
  LogBox,
} from "react-native"
import { useContext, useEffect, useState } from "react"
import { COLORS, colors } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import { Table, Rows } from "react-native-table-component"
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import ButtonComponent from "../../Components/ButtonComponent"
import axios from "axios"
import { AppStore } from "../../Context/AppContext"
import { StackActions } from "@react-navigation/native"
import { address } from "../../Routes/addresses"
import { Alert } from "react-native"
import CancelButtonComponent from "../../Components/CancelButtonComponent"
// import logoCut from "../../Resources/Images/logo_cut.png"
import razor from "../../Resources/Images/razorpay.webp"
import { REACT_APP_BASE_URL, IMG_URL } from "../../Config/config"
import { getBase64FromUrl } from "../../Functions/getBase64FromUrl"

const AccountPreview = ({ navigation, route }) => {
  const [isLoading, setLoading] = useState(false)
  const [receiptNumber, setReceiptNumber] = useState(() => "")
  const [isSaveEnabled, setIsSaveEnabled] = useState(() => false)
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
    allowCollectionDays,
    secAmtType,
    bankId,
    branchCode,
    printOp,
    logo_path
  } = useContext(AppStore)

  const { item, money } = route.params

  const [lastTnxDate, setLastTnxDate] = useState(() => "")

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
    ["Current Balance", +item?.current_balance + parseFloat(money)],
  ]

  const resetAction = StackActions.popToTop()

  const getLastTnxDate = async () => {
    const obj = {
      bank_id: bankId,
      branch_code: branchCode,
      agent_code: userId,
      account_number: item?.account_number,
      flag: "D",
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
      total_amount: +item?.current_balance + parseFloat(money),
      deposit_amount: parseFloat(money),
      collection_by: id,
      sec_amt_type: secAmtType,
      total_collection_amount: totalCollection,
      // flag:'D'
    }
    console.log("===========", obj)
    await axios
      .post(address.TRANSACTION, obj, {
        headers: {
          Accept: "application/json",
        },
      })
      .then(res => {
        console.log("result " + res.data.status)
        if (res.data.status) {
          setLoading(false)
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
          console.log("result else gggggggggggggggggg", res.data)

          alert("Data already submitted. Please upload new dataset.")
          ToastAndroid.showWithGravityAndOffset(
            res.data,
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
          console.log("logo_base64 (start)", _imgBase64 ? _imgBase64.substring(0, 200) : null)
          if (_imgBase64) {
            await BluetoothEscposPrinter.printPic(
              _imgBase64,
              { width: 150, align: "center", left: 15 },
            )
            await BluetoothEscposPrinter.printText("\r\n", {})
          }
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(bankName + '\r\n', { align: "center" })
        // await BluetoothEscposPrinter.printText("\r", {})
        await BluetoothEscposPrinter.printText(branchName + '\r\n', { align: "center" })
        // await BluetoothEscposPrinter.printText("\r", {})

        await BluetoothEscposPrinter.printText("RECEIPT\n", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\r\n", {})

        await BluetoothEscposPrinter.printText(
          "-------------------------------\n",
          {},
        )
        // await BluetoothEscposPrinter.printText("\r\n", {})

        let columnWidths = [11, 1, 18]

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "AGENT NAME",
            ":",
            agentName.toString(),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "RCPT DATE",
            ":",
            (
              new Date(todayDT).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              }) +
              ", " +
              new Date(todayDT).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            ).toString(),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["RCPT NO", ":", rcptNo.toString().substring(0, 6)],
          ["RCPT NO", ":", rcptNo.toString().slice(-6)],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ACC NO", ":", (item?.account_number).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["NAME", ":", item?.customer_name.toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["OPEN BAL", ":", (item?.current_balance).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["COLL AMT", ":", money.toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "CLOSE BAL",
            ":",
            parseFloat(+item?.current_balance + parseFloat(money)).toString(),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "PRV TNX DT",
            ":",
            lastTnxDate // this is shit -> to be changed later
              ? new Date(lastTnxDate) // this is shit -> -> to be changed later
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
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "ACC OPN DT",
            ":",
            new Date(item?.opening_date)
              .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
              .toString(),
          ],
          {},
        )

        // await BluetoothEscposPrinter.printText("\r\n", {})

        // await BluetoothEscposPrinter.printText("\r\n", {})
        await BluetoothEscposPrinter.printText(
          "---------------X---------------\n\n",
          {},
        )

        // await BluetoothEscposPrinter.printText("\r", {})
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
          console.log("logo_base64 (start)", _imgBase64 ? _imgBase64.substring(0, 200) : null)
          if (_imgBase64) {
            await BluetoothEscposPrinter.printPic(
              _imgBase64,
              { width: 150, align: "center", left: 80 },
            )
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

        await BluetoothEscposPrinter.printText("RECEIPT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\r", {})

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------",
          {},
        )
        await BluetoothEscposPrinter.printText("\r\n", {})

        let columnWidths = [20, 2, 26]

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["AGENT NAME", ":", agentName.toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "RCPT DATE",
            ":",
            (
              new Date(todayDT).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              }) +
              ", " +
              new Date(todayDT).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            ).toString(),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["RCPT NO", ":", rcptNo.toString().substring(0, 6)],
          ["RCPT NO", ":", rcptNo.toString().slice(-6)],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ACC NO", ":", (item?.account_number).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["NAME", ":", item?.customer_name.toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["OPEN BAL", ":", (item?.current_balance).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["COLL AMT", ":", money.toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "CLOSE BAL",
            ":",
            parseFloat(+item?.current_balance + parseFloat(money)).toString(),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "PRV TNX DT",
            ":",
            lastTnxDate // this is shit -> to be changed later
              ? new Date(lastTnxDate) // this is shit -> -> to be changed later
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
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "ACC OPN DT",
            ":",
            new Date(item?.opening_date)
              .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
              .toString(),
          ],
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

  console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR", secAmtType)

  const handleSave = () => {
    getTotalDepositAmount()
    // console.log("##$$$$###$$$", maximumAmount, money, totalDepositedAmount)
    // console.log("##$$$$+++++###$$$", money + totalDepositedAmount)
    // console.log("##$$$$+++++###$$$", typeof money, typeof totalDepositedAmount)
    // console.log("##$$$$+++++###$$$", parseFloat(money) + totalDepositedAmount)
    console.log("SEC AMT TYPE===============>>>>>>>>>>>>>", secAmtType)

    if (secAmtType == "M") {
      console.log("MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM")
      console.log("TTTTTYYYYYPPPPPEEEEE", maximumAmount)
      console.log("TTTTTYYYYYPPPPPEEEEE", allowCollectionDays)
      console.log("##$$$$###$$$", maximumAmount * allowCollectionDays)
      console.log("##$$$$+++++###$$$", parseFloat(money) + totalDepositedAmount)
      console.log(
        "##$$$$+++++###$$$ totalDepositedAmount",
        totalDepositedAmount,
      )
      console.log("##$$$$+++++###$$$ totalCollection", totalCollection)

      // if (maximumAmount >= parseFloat(money) + totalDepositedAmount) {
      if (maximumAmount >= parseFloat(money) + totalCollection) {
        console.log("MMMMMMMMMMMMMMMM")
        setIsSaveEnabled(true)
        sendCollectedMoney()
        // maximumAmount -= money
        login()
      } // M
      else {
        ToastAndroid.showWithGravityAndOffset(
          "Your collection quota has been exceeded.",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        )
      }
    } else if (secAmtType == "A") {
      console.log("AAAAAAAAAAAAAAAAAA")

      console.log("TTTTTYYYYYPPPPPEEEEE maximumAmount", maximumAmount)
      console.log(
        "TTTTTYYYYYPPPPPEEEEE allowCollectionDays",
        allowCollectionDays,
      )
      console.log(
        "##$$$$###$$ maximumAmount * allowCollectionDays",
        maximumAmount * allowCollectionDays,
      )
      console.log(
        "##$$$$+++++###$$$ (money) + totalDepositedAmount",
        parseFloat(money) + totalDepositedAmount,
      )

      console.log(
        "##$$$$+++++###$$$ totalDepositedAmount",
        totalDepositedAmount,
      )
      console.log("##$$$$+++++###$$$ totalCollection", totalCollection)

      if (maximumAmount >= parseFloat(money) + totalCollection) {
        setIsSaveEnabled(true)
        sendCollectedMoney()
        // maximumAmount -= money
        login()
      } // A
      else {
        ToastAndroid.showWithGravityAndOffset(
          "Your collection quota has been exceeded.",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        )
      }
    }
  }

  // useEffect(() => {
  //   getTotalDepositAmount()
  // }, [])

  // const sendFinalCollectedMoney = () => {
  //   getTotalDepositAmount()

  //   console.log("Total Deposited Amount", totalDepositedAmount)
  // }

  // const handleRazorpayClient = () => {
  //   // console.log("Razorpay client...")

  //   const options = {
  //     description: "Deposit Payment",
  //     image:
  //       "https://synergicsoftek.in/wp-content/themes/synergicsoftek-child/assets/images/sss-logo.png", // Your logo URL
  //     currency: "INR",
  //     key: "YOUR_RAZORPAY_KEY", // Your Razorpay Key
  //     // key: "rzp_live_6NEMkMwtW0VXWs", // Your Razorpay Key
  //     amount: money * 100, // amount in paise (INR 1 = 100 paise)
  //     name: item.customer_name,
  //     prefill: {
  //       // email: "customer-email@example.com",
  //       contact: item.mobile_no,
  //       name: item.customer_name,
  //     },
  //     theme: { color: "#F37254" },
  //   }

  //   RazorpayCheckout.open(options)
  //     .then(data => {
  //       // handle success
  //       alert(`Success: ${data.razorpay_payment_id}`)
  //       // Proceed with saving the transaction
  //       sendCollectedMoney()
  //     })
  //     .catch(error => {
  //       // handle failure
  //       alert(`Error: ${error.code} | ${error.description}`)
  //     })
  // }

  return (
    <View>
      <CustomHeader />
      <ScrollView
        style={{
          backgroundColor: COLORS.lightScheme.background,
          height: "90%",
          padding: 10,
        }}>
        {/* <ScrollView> */}
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
          <View style={styles.buttonContainer}>
            <CancelButtonComponent
              title={"Back"}
              customStyle={{
                marginTop: 10,
                backgroundColor: "white",
                colors: "red",
                width: "40%",
              }}
              handleOnpress={() => {
                navigation.goBack()
              }}
            />
            <ButtonComponent
              disabled={isLoading}
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
            // disabled={isSaveEnabled}
            />
          </View>
        </View>

        {/* </ScrollView> */}
      </ScrollView>
    </View>
  )
}

export default AccountPreview

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
  image: {
    height: 80,
    width: "80%",
    alignSelf: "center",
  },
})
