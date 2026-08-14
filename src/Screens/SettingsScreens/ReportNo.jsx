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
// import DateTimePickerModal from "react-native-modal-datetime-picker"
import { AppStore } from "../../Context/AppContext"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS, colors } from "../../Resources/colors"
import { Table, Rows, Row } from "react-native-table-component"
import axios from "axios"
import { REACT_APP_BASE_URL } from "../../Config/config"
import DropdownComponent from "../../Components/DropdownComponent"
// import DateRangePicker from '../../Components/DateRangePicker'
// import Calandar from "react-native-calendars/src/calendar"
// import Calendar from "react-native-calendar-range-picker"
import CalendarPicker from "react-native-calendar-picker"
import { Dropdown } from "react-native-element-dropdown"
import { address } from "../../Routes/addresses"
import React from 'react'

function ReportNo() {
  const { userId, bankId, branchCode } = useContext(AppStore)

  // const [startingDate, setStartingDate] = useState(() => "From Date") // date in yyyy-mm-dd
  // const [endingDate, setEndingDate] = useState(() => "To Date") // date in yyyy-mm-dd

  // const [isStartingDatePickerVisible, setIsStartingDatePickerVisible] = useState(() => false)
  // const [isEndingDatePickerVisible, setIsEndingDatePickerVisible] = useState(() => false)
  // const [isDisabled,setIsDisabled] = useState(true)

  const [typeWiseReportArray, setTypeWiseReportArray] = useState(() => [])
  const [accountType, setAccountType] = useState(() => "")
  const [isLoading, setIsLoading] = useState(false)

  const [showModal, setShowModal] = useState(() => false)
  const [selectedStartDate, setSelectedStartDate] = useState(() => new Date())
  const [selectedEndDate, setSelectedEndDate] = useState(() => new Date())
  const [isDisabled, setIsDisabled] = useState(true)

  const [focusDrop, setFocusDrop] = useState(() => false)

  const [totalAmount, setTotalAmount] = useState(() => 0)

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

  // const showStartingDatePicker = () => {
  //   setIsStartingDatePickerVisible(true)
  // }

  // const showEndingDatePicker = () => {
  //   setIsEndingDatePickerVisible(true)
  // }

  // const hideStartingDatePicker = () => {
  //   setIsStartingDatePickerVisible(false)
  // }

  // const hideEndingDatePicker = () => {
  //   setIsEndingDatePickerVisible(false)
  // }

  // const handleConfirmPickedFromDate = date => {
  //   console.warn("PICKED DATE >>>>>>>>>>>", date)
  //   const modifiedFromDate = new Date(date).toISOString().slice(0, 10)
  //   setStartingDate(modifiedFromDate)
  //   hideStartingDatePicker()
  // }

  // const handleConfirmPickedToDate = date => {
  //   console.warn("PICKED DATE >>>>>>>>>>>", date)
  //   const modifiedToDate = new Date(date).toISOString().slice(0, 10)
  //   setEndingDate(modifiedToDate)
  //   hideEndingDatePicker()
  // }

  const data = [
    { label: "Daily", value: "D" },
    { label: "Loan", value: "L" },
    { label: "RD", value: "R" },
  ]

  const tableHead = ["Sl No.", "Date", "A/C Type", "A/c No.", "Name", "Amount"]
  let tableData = typeWiseReportArray

  const getReportsTypeScroll = async () => {
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
    let totalDepositedAmount = 0
    await axios
      .post(address.NO_WISE_REPORT, obj, {
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
            new Date(item.date).toLocaleDateString("en-GB"),
            item.product_code,
            item.account_number,
            item.account_holder_name,
            item.deposit_amount,
          ]
          totalDepositedAmount += +item.deposit_amount
          console.log("ITEMMM TABLEEE=====", rowArr)
          tableData.push(...[rowArr])
        })

        setTotalAmount(totalDepositedAmount)
        console.log("++++++ TABLE DATA ++++++++", tableData)
        setTypeWiseReportArray(tableData)

        if (tableData.length === 0) {
          setIsLoading(false)
          setIsDisabled(false)
          ToastAndroid.showWithGravityAndOffset(
            "No data found!",
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
            25,
            50,
          )
        }
      })
      .catch(err => {
        ToastAndroid.showWithGravityAndOffset(
          "Error occurred in the server",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
          setIsLoading(false),
          setIsDisabled(false),
        )
        console.log(err)
      })
  }

  const handleSubmit = () => {
    tableData = []
    getReportsTypeScroll()
  }

  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<", tableData)

  console.log("###################", accountType)
  return (
    <View style={{ flex: 1 }}>
      <CustomHeader />
      <View
        style={{
          flex: 4,
          padding: 10,
          backgroundColor: COLORS.lightScheme.background,
          margin: 20,
          borderRadius: 10,
        }}>
        <Text style={styles.todayCollection}>No. Wise Report</Text>
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
            {/* <Text style={{color: "white"}}>Show Calendar</Text> */}
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
                backgroundColor: "#FFFFFF",
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
        <View>
          {/* <View style={{justifyContent: "space-around", flexDirection: "row", backgroundColor: "coral", padding: 10, margin: 10, borderRadius: 10}}>
            <Text style={{ fontSize: 15, fontWeight: 500, color: COLORS.lightScheme.onPrimary, fontWeight: "bold" }}>From: {startDate}</Text>
            <Text style={{ fontSize: 15, fontWeight: 500, color: COLORS.lightScheme.onPrimary, fontWeight: "bold" }}>To: {endDate}</Text>
          </View> */}
          {/* <DropdownComponent
            data={data}
            onFocus={() => setFocusDrop(true)}
            onBlur={() => setFocusDrop(false)}
            onChangeDrop={(value) => {
              setAccountType(value)
              setFocusDrop(false)
            }}>
            Select Type
          </DropdownComponent> */}

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
          {/* {isLoading && <ActivityIndicator color={COLORS.lightScheme.primary} size={'large'}></ActivityIndicator>} */}
          {tableData.length != 0 && (
            <Table
              borderStyle={{
                borderWidth: 2,
                borderColor: COLORS.lightScheme.onTertiaryContainer,
                borderRadius: 10,

              }}
              style={{ backgroundColor: COLORS.lightScheme.onPrimary }}>
              <Row data={tableHead} textStyle={styles.head} />
              <Rows data={tableData} textStyle={styles.text} />
            </Table>
          )}
        </ScrollView>
        <Text>Total Amount: {totalAmount}</Text>
      </View>
    </View>
  )
}

export default ReportNo

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
    borderColor: COLORS.lightScheme.primary,
    backgroundColor: COLORS.lightScheme.primary,
    margin: 15,
    borderRadius: 30,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    margin: 9,
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
  label: {
    position: "absolute",
    backgroundColor: "white",
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  submitBtnTxt: {
    color: "white",
  },
  btnlabel: {
    color: "white",
    fontWeight: "bold",
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