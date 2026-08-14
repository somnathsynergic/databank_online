import { useContext, useState } from "react"
import {
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ToastAndroid,
  Modal,
  ActivityIndicator,
} from "react-native"
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import { AppStore } from "../../Context/AppContext"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS, colors } from "../../Resources/colors"
import { Table, Rows, Row } from "react-native-table-component"
import axios from "axios"
import { IMG_URL } from "../../Config/config"
import { getBase64FromUrl } from "../../Functions/getBase64FromUrl"
import CalendarPicker from "react-native-calendar-picker"
import { address } from "../../Routes/addresses"
import { Dropdown } from "react-native-element-dropdown"
import { SCREEN_HEIGHT } from "react-native-normalize"

const DateWiseCollSummary = () => {
  const {
    userId,
    bankId,
    branchCode,
    maximumAmount,
    getTotalDepositAmount,
    totalDepositedAmount,
    todayDateFromServer,
    agentName,
    bankName,
    branchName,
    totalCollection,
    login,
    id,
    logo_path,
  } = useContext(AppStore)

  const [selectedStartDate, setSelectedStartDate] = useState(() => new Date())
  const [selectedEndDate, setSelectedEndDate] = useState(() => new Date())
  const [accountType, setAccountType] = useState(() => "")
  const [focusDrop, setFocusDrop] = useState(() => false)

  const [showModal, setShowModal] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [dtWiseCollSummaryArray, setDtWiseCollSummaryArray] = useState(() => [])

  const [totalReceipts, setTotalReceipts] = useState(() => 0)

  const [total, setTotal] = useState(() => 0)

  const startDate = selectedStartDate
    ? selectedStartDate.toISOString().slice(0, 10)
    : ""
  const endDate = selectedEndDate
    ? selectedEndDate.toISOString().slice(0, 10)
    : ""
  const renderLabel = () => {
    if (accountType || focusDrop) {
      return (
        <Text style={[styles.label, focusDrop && { color: "blue" }]}>
          Select type
        </Text>
      )
    }
    return null
  }
  const data = [
    { label: "Daily", value: "D" },
    { label: "Loan", value: "L" },
    { label: "RD", value: "R" },
  ]

  const onDateChange = (date, type) => {
    if (type === "END_DATE") {
      setSelectedEndDate(date)
      setShowModal(false)
    } else {
      setSelectedStartDate(date)
      setSelectedEndDate(null)
    }
  }

  const tableHead = ["Sl. No.", "Date", "No. of Receipts", "Collected Amt."]
  let tableData = dtWiseCollSummaryArray

  const getReportsDayScroll = async () => {
    setIsLoading(true)
    setIsDisabled(true)

    const obj = {
      bank_id: bankId,
      branch_code: branchCode,
      agent_code: userId,
      from_date: startDate,
      to_date: endDate,
      account_type: accountType,
    }
    let rcpts = 0
    let totalAmount = 0
    await axios
      .post(address.DATE_WISE_COLL_SUMMARY, obj, {
        headers: {
          Accept: "application/json",
        },
      })
      .then(res => {
        setIsLoading(false)
        setIsDisabled(false)

        res.data.success.msg.forEach((item, i) => {
          let rowArr = [
            i + 1,
            new Date(item.date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            }),
            item.rcpts,
            // item.account_type == "D"
            //   ? "Daily"
            //   : item.account_type == "R"
            //   ? "RD"
            //   : item.account_type == "L"
            //   ? "Loan"
            //   : "",
            // item.account_number,
            // item.account_holder_name,
            item.deposit_amount,
          ]
          rcpts += item.rcpts
          setTotalReceipts(rcpts)
          totalAmount += +item.deposit_amount
          setTotal(totalAmount)
          console.log("ITEMMM TABLEEE=====", rowArr)
          tableData.push(...[rowArr])
        })
        if (tableData.length == 0) {
          ToastAndroid.showWithGravityAndOffset(
            "No data found!",
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
            25,
            50,
          )
        }
        // setTotalAmount(totalAmount)
        console.log("++++++ TABLE DATA ++++++++", tableData)
        setDtWiseCollSummaryArray(tableData)
      })
      .catch(err => {
        setIsLoading(false)
        setIsDisabled(false)

        ToastAndroid.showWithGravityAndOffset(
          "Error occurred in the server",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        )
        console.log(err)
      })
  }

  const handleSubmit = () => {
    tableData = []
    getReportsDayScroll()
  }

  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<", tableData)

  async function printReceipt() {
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

      await BluetoothEscposPrinter.printColumn(
        [10, 2, 18],
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        [
          "Date",
          ":",
          new Date()
            .toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })
            .toString(),
        ],
        {},
      )

      await BluetoothEscposPrinter.printText(
        "-------------------------------\n",
        {},
      )

      await BluetoothEscposPrinter.printText("SUMMARY REPORT\n", {
        align: "center",
      })

      // await BluetoothEscposPrinter.printText("\r", {})

      await BluetoothEscposPrinter.printText(
        "-------------------------------\n",
        {},
      )
      // await BluetoothEscposPrinter.printText("\r\n", {})

      let columnWidthsHeader = [10, 6, 10]
      await BluetoothEscposPrinter.printColumn(
        columnWidthsHeader,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["Date", "Rcpts", "Coll Amt"],
        {},
      )

      let columnWidthsBody = [30]
      dtWiseCollSummaryArray.forEach(async item => {
        let newItems = [...item]
        newItems.shift()
        let items = newItems.join("      ")
        console.log("++==++ PRINTED ITEM", items)
        await BluetoothEscposPrinter.printColumn(
          columnWidthsBody,
          [BluetoothEscposPrinter.ALIGN.CENTER],
          [items.toString()],
          {},
        )
      })

      await BluetoothEscposPrinter.printText(
        "-------------------------------\n",
        {},
      )
      await BluetoothEscposPrinter.printText(
        "Total Receipts: " + totalReceipts + "\n",
        { align: "center" },
      )
      await BluetoothEscposPrinter.printText("Total Amount: " + total + "\n", {
        align: "center",
      })
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
  }

  return (
    <ScrollView style={{ height: SCREEN_HEIGHT * 0.8 }}>
      <CustomHeader />
      <View
        style={{
          flex: 4,
          padding: 10,
          backgroundColor: COLORS.lightScheme.background,
          margin: 20,
          borderRadius: 10,
        }}>
        <Text style={styles.todayCollection}>Date Wise Collection Summary</Text>
        <View style={styles.dateWrapper}>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={{
              justifyContent: "space-around",
              flexDirection: "row",
              backgroundColor: "white",
              borderColor: COLORS.lightScheme.primary,
              borderWidth: 1,
              padding: 10,
              margin: 10,
              borderRadius: 10,
              height: 40,
              width: "100%",
            }}>
            {/* <Text>Show Calendar</Text> */}
            <Text
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: COLORS.lightScheme.primary,
                fontWeight: "bold",
              }}>
              From: {new Date(startDate).toLocaleDateString("en-GB")}
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: COLORS.lightScheme.primary,
                fontWeight: "bold",
              }}>
              To: {new Date(endDate).toLocaleDateString("en-GB")}
            </Text>
          </TouchableOpacity>
          <Modal visible={showModal} animationType="fade">
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.lightScheme.onPrimary,
                margin: 20,
              }}>
              <CalendarPicker
                width={350}
                height={350}
                startFromMonday={true}
                allowRangeSelection={true}
                todayBackgroundColor="tomato"
                selectedDayColor="dodgerblue"
                selectedDayTextColor="#FFFFFF"
                onDateChange={onDateChange}
              />
            </View>
          </Modal>
        </View>
        {/* <View style={{justifyContent: "space-around", flexDirection: "row", backgroundColor: "coral", padding: 10, margin: 10, borderRadius: 10}}>
            <Text style={{ fontSize: 15, fontWeight: 500, color: COLORS.lightScheme.onPrimary, fontWeight: "bold" }}>From: {startDate}</Text>
            <Text style={{ fontSize: 15, fontWeight: 500, color: COLORS.lightScheme.onPrimary, fontWeight: "bold" }}>To: {endDate}</Text>
          </View> */}
        <View style={styles.dropdownContainer}>
          {renderLabel()}
          <Dropdown
            style={[styles.dropdown, focusDrop && { borderColor: "blue" }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={data}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!focusDrop ? "Select type" : "..."}
            searchPlaceholder="Search..."
            value={accountType}
            onFocus={() => setFocusDrop(true)}
            onBlur={() => setFocusDrop(false)}
            onChange={item => {
              setIsDisabled(false)

              setAccountType(item.value)
              setFocusDrop(false)
            }}
          // renderLeftIcon={() => (
          //   <AntDesign
          //     style={styles.icon}
          //     color={isFocus ? 'blue' : 'black'}
          //     name="Safety"
          //     size={20}
          //   />
          // )}
          />
        </View>
        <View>
          <TouchableOpacity
            disabled={isDisabled || isLoading}
            onPress={() => handleSubmit()}
            style={isDisabled ? styles.disabledContainer : styles.dateButton}>
            {isLoading ? (
              <ActivityIndicator
                color={COLORS.lightScheme.primary}
                size={"large"}></ActivityIndicator>
            ) : (
              <Text style={styles.btnlabel}>SUBMIT</Text>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView>
          {tableData.length != 0 && (
            <Table
              borderStyle={{
                borderWidth: 2,
                borderColor: COLORS.lightScheme.secondary,
                borderRadius: 10,
              }}
              style={{ backgroundColor: COLORS.lightScheme.background }}>
              <Row data={tableHead} textStyle={styles.head} />
              <Rows data={tableData} textStyle={styles.text} />
            </Table>
          )}
        </ScrollView>
        <View>
          <Text style={styles.footerText}>Total Receipts: {totalReceipts}</Text>
          <Text style={styles.footerText}>Total Amount: {total}/-</Text>
        </View>
        <View>
          <TouchableOpacity
            disabled={tableData.length == 0}
            onPress={() => printReceipt()}
            style={
              tableData.length != 0
                ? styles.dateButton
                : styles.disabledContainer
            }>
            <Text style={styles.btnlabel}>PRINT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

export default DateWiseCollSummary

const styles = StyleSheet.create({
  dateWrapper: {
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
    flexDirection: "row",
    margin: 20,
  },
  btnlabel: {
    color: "white",
    fontWeight: "bold",
  },
  dateButton: {
    width: "40%",
    height: 40,
    borderWidth: 2,
    borderColor: COLORS.lightScheme.primary,
    backgroundColor: COLORS.lightScheme.primary,
    margin: 15,
    borderRadius: 30,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    margin: 6,
    color: COLORS.lightScheme.onBackground,
    fontWeight: "400",
    fontSize: 10,
  },
  head: {
    margin: 6,
    color: COLORS.lightScheme.onBackground,
    fontWeight: "900",
    fontSize: 10,
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
  dropdownContainer: {
    backgroundColor: "white",
    padding: 16,
  },
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  footerText: {
    fontSize: 15,
    fontWeight: "600",
  },
  disabledContainer: {
    width: "40%",
    height: 40,
    borderWidth: 2,
    borderColor: "lightgray",
    backgroundColor: "lightgray",
    margin: 15,
    borderRadius: 30,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
})
