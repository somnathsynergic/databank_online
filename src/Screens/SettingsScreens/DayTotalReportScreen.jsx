import { useContext, useEffect, useState } from "react"
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
import { REACT_APP_BASE_URL, IMG_URL } from "../../Config/config"
import { getBase64FromUrl } from "../../Functions/getBase64FromUrl"
import CalendarPicker from "react-native-calendar-picker"
import { address } from "../../Routes/addresses"
import { removeIndexes } from "../../Functions/removeIndexes"
import { Dropdown } from "react-native-element-dropdown"
import { table } from "console"
import { NodePath } from "@babel/core"
import NoData from "../../Components/NoData"
import { SCREEN_HEIGHT } from "react-native-normalize"

const DayTotalReportScreen = () => {
  const { userId, bankId, branchCode, agentName, bankName, branchName, printOp, logo_path } =
    useContext(AppStore)

  // const [startingDate, setStartingDate] = useState(() => "From Date") // date in yyyy-mm-dd
  // const [endingDate, setEndingDate] = useState(() => "To Date") // date in yyyy-mm-dd

  const [selectedStartDate, setSelectedStartDate] = useState(() => new Date())
  const [selectedEndDate, setSelectedEndDate] = useState(() => new Date())
  const [isData, setIsData] = useState(true)
  const [accountType, setAccountType] = useState(() => "")
  const [focusDrop, setFocusDrop] = useState(() => false)
  const [showModal, setShowModal] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(false)
  // const [isStartingDatePickerVisible, setIsStartingDatePickerVisible] = useState(() => false)
  // const [isEndingDatePickerVisible, setIsEndingDatePickerVisible] = useState(() => false)

  const [dayTotalReportArray, setDayTotalReportArray] = useState(() => [])

  const [totalAmount, setTotalAmount] = useState(() => 0)
  const [isLoading, setIsLoading] = useState(false)

  const startDate = selectedStartDate
    ? selectedStartDate.toISOString().slice(0, 10)
    : ""
  const endDate = selectedEndDate
    ? selectedEndDate.toISOString().slice(0, 10)
    : ""

  const onDateChange = (date, type) => {
    if (type === "END_DATE") {
      setSelectedEndDate(date)
      setShowModal(false)
    } else {
      setSelectedStartDate(date)
      setSelectedEndDate(null)
    }
  }

  const tableHead = ["Date", "No. of Transactions", "Amount"]
  let tableData = dayTotalReportArray

  const getReportsDayScroll = async () => {
    setIsLoading(true)
    setIsDisabled(true)
    // console.log(isLoading)
    const obj = {
      bank_id: bankId,
      branch_code: branchCode,
      agent_code: userId,
      from_date: startDate,
      to_date: endDate,
      //   account_type: accountType,
    }
    let totalCollectedAmount = 0
    await axios
      .post(address.DAY_TOTAL_REPORT, obj, {
        headers: {
          Accept: "application/json",
        },
      })
      .then(res => {
        setIsLoading(false)
        setIsDisabled(false)

        res.data.success.msg.forEach((item, i) => {
          let rowArr = [
            new Date(item.trns_date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            }),
            item.tot_col,
            item.tot_col_amt,
          ]
          totalCollectedAmount += +item.tot_col_amt
          console.log("ITEMMM TABLEEE=====", rowArr)
          tableData.push(...[rowArr])
          // printReceipt(item.date, startDate, endDate, item.account_number, item.account_holder_name, item.deposit_amount)
        })
        if (tableData.length == 0) {
          console.log(tableData)
          ToastAndroid.showWithGravityAndOffset(
            "No data found!",
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
            25,
            50,
          )
        }
        setTotalAmount(totalCollectedAmount)
        console.log("++++++ TABLE DATA ++++++++", tableData)
        setDayTotalReportArray(tableData)
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

  async function printReceipt() {
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
        await BluetoothEscposPrinter.printColumn(
          [10, 2, 18],
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["Agent", ":", agentName],
          {},
        )

        await BluetoothEscposPrinter.printText(
          "-------------------------------\n",
          {},
        )

        await BluetoothEscposPrinter.printText("DAY TOTAL REPORT\n", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText(
          `FROM: ${new Date(startDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}  TO: ${new Date(endDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}`,
          {
            align: "center",
          },
        )

        await BluetoothEscposPrinter.printText(
          "\n-------------------------------\n",
          {},
        )
        // await BluetoothEscposPrinter.printText("\r\n", {})

        let columnWidthsHeader = [10, 10, 10]
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["Date", "A/c No", "Amt"],
          ["Date", "Tnxs.", "Amt"],
          {},
        )

        await BluetoothEscposPrinter.printText(
          "-------------------------------\n",
          {},
        )

        const copiedTableData = [...tableData]
        console.log("TABLLLELEEEEE DDDAAATAAAA  CPPPYYY ", copiedTableData)

        let columnWidthsBody = [13, 12, 7]
        copiedTableData.forEach(async item => {
          let newItems = [...item]
          console.log("new itemsssssss", newItems)
          // const updatedItems = removeIndexes(newItems, [0, 2, 4])
          // const updatedItems = removeIndexes(newItems, [0, 1, 2])
          let amtStr = newItems[2].toString()
          if (amtStr.includes('.')) {
            amtStr = parseFloat(amtStr).toString()
          }
          // updatedItems[2] = updatedItems[2].slice(0, 8)
          // let items = updatedItems.join(" ")
          // console.log("++==++ PRINTED ITEM", items)
          // console.log("++==++ PRINTED ITEM", updatedItems)
          await BluetoothEscposPrinter.printColumn(
            columnWidthsBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              newItems[0].toString(),
              newItems[1].toString(),
              amtStr,
            ],
            {},
          )
        })

        await BluetoothEscposPrinter.printText(
          "-------------------------------\n",
          {},
        )

        await BluetoothEscposPrinter.printText(
          `TOTAL AMOUNT: ${totalAmount}\r\n`,
          {
            align: "center",
          },
        )
        // await BluetoothEscposPrinter.printText("Total Receipts: " + totalReceipts + "\n", { align: "center" })
        // await BluetoothEscposPrinter.printText("Total Amount: " + total + "\n", { align: "center" })
        await BluetoothEscposPrinter.printText(
          "---------------X---------------\n\n",
          {},
        )

        // await BluetoothEscposPrinter.printText("\r\n", {})
      } catch (e) {
        console.log(e.message || "ERROR")
        ToastAndroid.showWithGravityAndOffset(
          "Printer not connected.",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        )
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
        await BluetoothEscposPrinter.printColumn(
          [15, 2, 31],
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
        await BluetoothEscposPrinter.printColumn(
          [15, 2, 31],
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["Agent", ":", agentName],
          {},
        )

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------\n",
          {},
        )

        await BluetoothEscposPrinter.printText("DAY TOTAL REPORT\r\n", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText(
          `FROM: ${new Date(startDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}  TO: ${new Date(endDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}`,
          {
            align: "center",
          },
        )

        await BluetoothEscposPrinter.printText("\r", {})

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------",
          {},
        )
        await BluetoothEscposPrinter.printText("\r\n", {})

        let columnWidthsHeader = [16, 16, 16]
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["Date", "A/c No", "Amt"],
          ["Date", "Tnxs.", "Amt"],
          {},
        )

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------\n",
          {},
        )

        const copiedTableData = [...tableData]
        console.log("TABLLLELEEEEE DDDAAATAAAA  CPPPYYY ", copiedTableData)

        let columnWidthsBody = [13, 25, 10]
        copiedTableData.forEach(async item => {
          let newItems = [...item]
          console.log("new itemsssssss", newItems)
          // const updatedItems = removeIndexes(newItems, [0, 2, 4])
          // const updatedItems = removeIndexes(newItems, [0, 1, 2])

          // updatedItems[2] = updatedItems[2].slice(0, 8)
          // let items = updatedItems.join(" ")
          // console.log("++==++ PRINTED ITEM", items)
          // console.log("++==++ PRINTED ITEM", updatedItems)
          await BluetoothEscposPrinter.printColumn(
            columnWidthsBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              newItems[0].toString(),
              newItems[1].toString(),
              newItems[2].toString(),
            ],
            {},
          )
        })

        await BluetoothEscposPrinter.printText(
          "-------------------------------------------------\n",
          {},
        )

        await BluetoothEscposPrinter.printText(
          `TOTAL AMOUNT: ${totalAmount}\r\n`,
          {
            align: "center",
          },
        )
        // await BluetoothEscposPrinter.printText("Total Receipts: " + totalReceipts + "\n", { align: "center" })
        // await BluetoothEscposPrinter.printText("Total Amount: " + total + "\n", { align: "center" })
        await BluetoothEscposPrinter.printText(
          "--------------------X--------------------------",
          {},
        )

        await BluetoothEscposPrinter.printText("\r\n", {})
      } catch (e) {
        console.log(e.message || "ERROR")
        ToastAndroid.showWithGravityAndOffset(
          "Printer not connected.",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        )
      }
    }
  }
  async function printReceipt_posio() {
    if (printOp == 2) {
      try {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.RIGHT,
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
        await BluetoothEscposPrinter.printColumn(
          [10, 2, 20],
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
        await BluetoothEscposPrinter.printColumn(
          [10, 2, 20],
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["Agent", ":", agentName],
          {},
        )

        await BluetoothEscposPrinter.printText(
          "--------------------------------\n",
          {},
        )

        await BluetoothEscposPrinter.printText("DAY TOTAL REPORT\r\n", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText(
          `FROM: ${new Date(startDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}  TO: ${new Date(endDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}`,
          {
            align: "center",
          },
        )

        await BluetoothEscposPrinter.printText(
          "--------------------------------",
          {},
        )
        await BluetoothEscposPrinter.printText("\r\n", {})

        let columnWidthsHeader = [10, 12, 10]
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["Date", "Tnxs.", "Amt"],
          {},
        )

        await BluetoothEscposPrinter.printText(
          "--------------------------------\n",
          {},
        )

        const copiedTableData = [...tableData]
        let columnWidthsBody = [13, 12, 7]
        copiedTableData.forEach(async item => {
          let newItems = [...item]
          await BluetoothEscposPrinter.printColumn(
            columnWidthsBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              newItems[0].toString(),
              newItems[1].toString(),
              newItems[2].toString(),
            ],
            {},
          )
        })

        await BluetoothEscposPrinter.printText(
          "--------------------------------\n",
          {},
        )

        await BluetoothEscposPrinter.printText(
          `TOTAL AMOUNT: ${totalAmount}\r\n`,
          {
            align: "center",
          },
        )
        await BluetoothEscposPrinter.printText(
          "---------------X---------------",
          {},
        )

        await BluetoothEscposPrinter.printText("\r\n", {})
      } catch (e) {
        console.log(e.message || "ERROR")
        ToastAndroid.showWithGravityAndOffset(
          "Printer not connected.",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        )
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
        await BluetoothEscposPrinter.printColumn(
          [15, 2, 31],
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
        await BluetoothEscposPrinter.printColumn(
          [15, 2, 31],
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["Agent", ":", agentName],
          {},
        )

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------\n",
          {},
        )

        await BluetoothEscposPrinter.printText("DAY TOTAL REPORT\r\n", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText(
          `FROM: ${new Date(startDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}  TO: ${new Date(endDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}`,
          {
            align: "center",
          },
        )

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------",
          {},
        )
        await BluetoothEscposPrinter.printText("\r\n", {})

        let columnWidthsHeader = [16, 16, 16]
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["Date", "Tnxs.", "Amt"],
          {},
        )

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------\n",
          {},
        )

        const copiedTableData = [...tableData]
        let columnWidthsBody = [13, 25, 10]
        copiedTableData.forEach(async item => {
          let newItems = [...item]
          await BluetoothEscposPrinter.printColumn(
            columnWidthsBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              newItems[0].toString(),
              newItems[1].toString(),
              newItems[2].toString(),
            ],
            {},
          )
        })

        await BluetoothEscposPrinter.printText(
          "-------------------------------------------------\n",
          {},
        )

        await BluetoothEscposPrinter.printText(
          `TOTAL AMOUNT: ${totalAmount}\r\n`,
          {
            align: "center",
          },
        )
        await BluetoothEscposPrinter.printText(
          "--------------------X--------------------------",
          {},
        )

        await BluetoothEscposPrinter.printText("\r\n", {})
      } catch (e) {
        console.log(e.message || "ERROR")
        ToastAndroid.showWithGravityAndOffset(
          "Printer not connected.",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        )
      }
    }
  }

  // useEffect(() => {
  //   tableData = []
  //   getReportsDayScroll()
  // }, [selectedEndDate])

  const handleSubmit = () => {
    tableData = []
    getReportsDayScroll()
  }

  // console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<", tableData)
  return (
    
    <ScrollView style={{  height: SCREEN_HEIGHT * 0.8 }}>
      <CustomHeader />
      <View
        style={{
          flex: 4,
          padding: 10,
          backgroundColor: COLORS.lightScheme.background,
          margin: 20,
          borderRadius: 10,
        }}>
        <Text style={styles.todayCollection}>Day Total Report</Text>
        <View style={styles.dateWrapper}>
          {/* <TouchableOpacity onPress={() => showStartingDatePicker()} style={styles.dateButton}>
            <Text>{startingDate}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showEndingDatePicker()} style={styles.dateButton}>
            <Text>{endingDate}</Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isStartingDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmPickedFromDate}
            onCancel={hideStartingDatePicker}
          />
          <DateTimePickerModal
            isVisible={isEndingDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmPickedToDate}
            onCancel={hideEndingDatePicker}
          /> */}

          {/* <TouchableOpacity onPress={() => setShowModal(true)} style={styles.dateButton}>
            <Text>Show Calendar</Text>
          </TouchableOpacity> */}
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
          {/* {isLoading && <ActivityIndicator color={COLORS.lightScheme.primary} size={'large'}></ActivityIndicator>} */}
        </View>
        <ScrollView>
          {/* <Text > {tableData.length}</Text>  */}
          {/* {tableData.length==0 && !isLoading && <NoData/>} */}
          {tableData.length != 0 && (
            <Table
              borderStyle={{
                borderWidth: 2,
                borderColor: COLORS.lightScheme.secondary,
                borderRadius: 10,
              }}
              style={{ backgroundColor: COLORS.lightScheme.background }}>
              <Row
                hidden={!tableData}
                data={tableHead}
                textStyle={styles.head}
              />

              <Rows data={tableData} textStyle={styles.text} />
            </Table>
          )}
        </ScrollView>
        <Text>Total Amount: {totalAmount}</Text>
        <TouchableOpacity
          disabled={tableData.length == 0}
          onPress={() => printReceipt()}
          style={
            tableData.length != 0 ? styles.dateButton : styles.disabledContainer
          }>
          <Text style={styles.btnlabel}>PRINT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
   
  )
}

export default DayTotalReportScreen

const styles = StyleSheet.create({
  dateWrapper: {
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
    flexDirection: "row",
    margin: 20,
  },
  dateButton: {
    width: "40%",
    height: 40,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: COLORS.lightScheme.primary,
    margin: 15,
    borderRadius: PixelRatio.roundToNearestPixel(30),
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    color: COLORS.lightScheme.primary,
  },
  text: {
    margin: 6,
    color: COLORS.lightScheme.onBackground,
    fontWeight: "400",
    fontSize: 10,
  },
  btnlabel: {
    color: "white",
    fontWeight: "bold",
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
    borderColor: COLORS.lightScheme.primary,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  disabledContainer: {
    width: "40%",
    height: 40,
    borderWidth: 2,
    borderColor: "lightgray",
    backgroundColor: "lightgray",
    margin: 15,
    borderRadius: PixelRatio.roundToNearestPixel(30),
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
})
