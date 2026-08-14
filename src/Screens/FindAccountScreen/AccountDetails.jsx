import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
  Alert,
  Pressable,
  ToastAndroid,
  TouchableOpacity,
  Image,
} from "react-native"
import { useContext, useState, useEffect, useMemo } from "react"
import axios from "axios"
import { COLORS, colors } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import {
  Table,
  TableWrapper,
  Row,
  Rows,
  Col,
} from "react-native-table-component"
// import RadioGroup from "react-native-radio-buttons-group"
import InputComponent from "../../Components/InputComponent"
import ButtonComponent from "../../Components/ButtonComponent"
import mainNavigationRoutes from "../../Routes/NavigationRoutes"
import { AppStore } from "../../Context/AppContext"
import { StackActions, useFocusEffect } from "@react-navigation/native"
import CancelButtonComponent from "../../Components/CancelButtonComponent"
// import razor from "../../Resources/Images/razorpay.webp"
import { address } from "../../Routes/addresses"
import moment from "moment"

const AccountDetails = ({ navigation, route }) => {
  const [collectionMoney, setCollectionMoney] = useState(() => 0)
  const {
    modifiedAt,
    transDt,
    todayDateFromServer,
    holidayLock,
    getFlagsRequest,
    collectionFlag,
    endFlag,
    allowCollectionDays,
    userId,
    bankId,
    branchCode,
  } = useContext(AppStore)

  const { item } = route.params

  const [lastTnxDate, setLastTnxDate] = useState(() => "")

  // const radioButtons = useMemo(
  //   () => [
  //     {
  //       id: "1", // acts as primary key, should be unique and non-empty string
  //       label: "Receive Cash",
  //       value: "C",
  //     },
  //     {
  //       id: "2",
  //       label: "Pay Online",
  //       value: "O",
  //     },
  //   ],
  //   [],
  // )

  // const [selectedId, setSelectedId] = useState(() => "1")

  // console.log("RRRRTTTTTTTTTTTTTTT", selectedId)

  const tableData = [
    [
      "Account Type",
      item?.acc_type == "D"
        ? "Daily"
        : item?.acc_type == "R"
          ? "RD"
          : item?.acc_type == "L"
            ? "Loan"
            : "",
    ],
    ["Account No.", item?.account_number],
    ["Name", item?.customer_name],
    ["Mobile No.", item?.mobile_no],
    // ["Opening date", moment.utc(item?.opening_date).format("DD/MM/YYYY HH:mm")],
    ["Opening date", new Date(item?.opening_date).toLocaleDateString("en-GB")],

    [
      "Previous Transaction Date",
      lastTnxDate
        ? new Date(lastTnxDate).toLocaleDateString("en-GB")
        : "No available date",
    ],
    ["Current Balance", +item?.current_balance],
  ]

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

  useEffect(() => {
    getFlagsRequest()
  }, [])

  const handlePreviewData = () => {
    if (!collectionMoney || collectionMoney <= 0) {
      ToastAndroid.showWithGravityAndOffset(
        "Invalid Amount",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      )
      return
    }
    // setCollectionMoney(0)
    navigation.navigate(mainNavigationRoutes.accountPreview, {
      item: item,
      money: collectionMoney,
    })
  }

  // const handleRazorpayClient = () => {
  //   console.log("Razorpay client...")
  // }

  const checkDayLock = () => {
    let currentDate = new Date(todayDateFromServer.toISOString().slice(0, 10))
    console.log("CURRRRR DATEE", currentDate)
    let trans_dt = new Date(transDt.toISOString().slice(0, 10))
    console.log("MODDDD DATEsssssss", trans_dt)
    let newTrans_dt = trans_dt.setDate(
      trans_dt.getDate() + parseInt(allowCollectionDays),
    )
    newTrans_dt = new Date(newTrans_dt).toISOString().slice(0, 10)
    // console.log('NNNNEEEWWWWW TRANCE DT', new Date(newTrans_dt).toISOString().slice(0, 10), trans_dt);

    var date_dif = Math.abs(new Date() - new Date(transDt))
    date_dif = date_dif / (1000 * 60 * 60 * 24)
    // console.log('Police case kore6ile', date_dif, 'llala', allowCollectionDays);

    // let afterAddingHolidayLockDays = modifiedAtDate.getDate() + 1
    // newModifiedDate.setDate(modifiedAtDate.getDate() + holidayLock)
    // console.log("HOLIIIIDDDAAAAYYYYY _+++++++>>>", holidayLock)

    // return newTrans_dt >= currentDate
    return date_dif < allowCollectionDays
  }

  const checkHolidayLock = () => {
    let currentDate = new Date(todayDateFromServer.toISOString().slice(0, 10))
    console.log("CURRRRR DATEE", currentDate)
    let modifiedAtDate = new Date(modifiedAt.toISOString().slice(0, 10))
    console.log("MODDDD DATE", modifiedAtDate)
    let newModifiedDate = new Date()

    // let afterAddingHolidayLockDays = modifiedAtDate.getDate() + 1
    newModifiedDate.setDate(modifiedAtDate.getDate() + holidayLock)
    console.log("HOLIIIIDDDAAAAYYYYY _+++++++>>>", holidayLock)

    return newModifiedDate >= currentDate
  }

  // console.log("CHECKKK HOLIDAAAY LOCKKK fun()", checkHolidayLock())

  const checkIsCollectionEnded = () => {
    if (collectionFlag == "Y" && endFlag == "N") return false
    else if (collectionFlag == "N" && endFlag == "Y") return true
  }

  console.log("CHECKKK COLLL ENDEDDD ========>>>>>", checkIsCollectionEnded())

  return (
    <View>
      <CustomHeader />
      <View
        style={{
          backgroundColor: COLORS.lightScheme.background,
          height: "100%",
          padding: 10,
        }}>
        <ScrollView keyboardShouldPersistTaps={"handled"}>
          <Text style={styles.info}>Daily Account Info</Text>
          {/* Table Component */}
          <View style={styles.tableConatiner}>
            <Table
              borderStyle={{
                borderWidth: 5,
                borderColor: COLORS.lightScheme.primary,
                fontSize: 16,
              }}
              style={{ backgroundColor: COLORS.lightScheme.onPrimary }}>
              <Rows data={tableData} textStyle={styles.text} />
            </Table>
          </View>
          {/* Input Field */}

          {/* <View
            style={{
              // alignSelf: "center",
              marginVertical: 15,
            }}>
            <RadioGroup
              radioButtons={radioButtons}
              onPress={setSelectedId}
              selectedId={selectedId}
              layout="row"
              labelStyle={{
                fontWeight: "800",
                fontSize: 20,
              }}
            />
          </View> */}
          <View style={styles.inputContainer}>
            <InputComponent
              keyboardType={"numeric"}
              placeholder={"Enter Valid Amount"}
              label={"Collection Amount"}
              value={collectionMoney}
              handleChange={money => {
                if (/^\d*\.?\d*$/.test(money)) {
                  setCollectionMoney(money)
                }
              }}
              autoFocus={true}
            />
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
                  setCollectionMoney(0)
                  navigation.goBack()
                }}
              />

              <ButtonComponent
                title={"Preview / Save"}
                customStyle={{ marginTop: 10, width: "50%" }}
                handleOnpress={handlePreviewData}
                disabled={!(!checkIsCollectionEnded() && checkDayLock())}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

export default AccountDetails

const styles = StyleSheet.create({
  // text: {
  //   margin: 6,
  //   color: COLORS.lightScheme.onBackground,
  //   fontWeight: '400',
  //   fontSize: 18,
  // },
  text: {
    margin: 6,
    color: COLORS.lightScheme.onBackground,
    fontWeight: "400",
    fontSize: 18,
  },
  head: {
    margin: 6,
    color: COLORS.lightScheme.onBackground,
    fontWeight: "900",
    fontSize: 12,
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
  inputContainer: {
    padding: 20,
    marginVertical: 10,
    // padding: 10,
    backgroundColor: COLORS.lightScheme.onPrimary,
    borderRadius: 20,
    borderColor: COLORS.lightScheme.primary,
    borderWidth: 0.8,
    elevation: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  tableConatiner: {
    padding: 10,
    backgroundColor: COLORS.lightScheme.onPrimary,
    borderRadius: 5,
  },
  // image: {
  //   height: 100,
  //   width: "100%",
  //   alignSelf: "center",
  // },
})
