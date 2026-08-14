import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native"
import { useCallback, useContext, useEffect, useState } from "react"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS } from "../../Resources/colors"
import InputComponent from "../../Components/InputComponent"
import axios from "axios"
import { address } from "../../Routes/addresses"
import { AppStore } from "../../Context/AppContext"
import { useFocusEffect } from "@react-navigation/native"
import SearchCardMiniStatement from "../../Components/SearchCardMiniStatement"
import { Dropdown } from "react-native-element-dropdown"

const MiniStatement = ({ navigation, item }) => {
  const [searchValue, changeSearchValue] = useState(() => "")
  const [userBankDetails, setUserBankDetails] = useState(() => [])
  const [focusDrop, setFocusDrop] = useState(() => false)
  const [showModal, setShowModal] = useState(() => false)
  const [accountType, setAccountType] = useState(() => "")
  const [isReadonly, setReadonly] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { userId, bankId, branchCode } = useContext(AppStore)

  function handleAccountSearch() {
    if (!searchValue) {
      return
    }
    fetchBankDetails()
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
  const data = [
    { label: "Daily", value: "D" },
    { label: "Loan", value: "L" },
    { label: "RD", value: "R" },
  ]

  useEffect(() => {
    handleAccountSearch()
    console.log(userBankDetails)
  }, [searchValue])

  const fetchBankDetails = async () => {
    setIsLoading(true)
    const obj = {
      bank_id: bankId,
      branch_code: branchCode,
      agent_code: userId,
      account_number: searchValue,
      flag: accountType,
    }
    console.log(bankId, branchCode, userId, searchValue)
    console.log(userBankDetails)

    await axios
      .post(address.SEARCH_ACCOUNT, obj, {
        headers: {
          Accept: "application/json",
        },
      })
      .then(res => {
        setIsLoading(false)

        // console.log("bank details", res?.data)
        setUserBankDetails(res?.data?.success?.msg)
        if (res.data.length == 0)
          ToastAndroid.showWithGravityAndOffset(
            "No data found!",
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
            25,
            50,
          )
      })
      .catch(err => {
        setIsLoading(false)

        console.log(err)
      })
  }

  useFocusEffect(
    useCallback(() => {
      // alert('Screen was focused')
      return () => {
        // alert('Screen was unfocused')
        // // Useful for cleanup functions
        changeSearchValue("")
        setUserBankDetails([])
      }
    }, []),
  )

  return (
    <View>
      <CustomHeader />
      <View style={styles.container}>
        {/* Account Cards */}
        {isLoading && (
          <ActivityIndicator
            size={"large"}
            color={COLORS.lightScheme.primary}
          />
        )}
        <ScrollView
          style={{ maxHeight: "60%", top: 220 }}
          keyboardShouldPersistTaps="handled">
          {userBankDetails &&
            userBankDetails?.map((props, index) => {
              console.log("========================", props)
              return (
                <SearchCardMiniStatement
                  item={props}
                  index={index}
                  navigation={navigation}
                  key={index}
                />
              )
            })}
        </ScrollView>
        <View style={styles.dropdownContainer}>
          {/* {renderLabel()}
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
              // onConfirmSelectItem={()=>
              //   setReadonly(accountType?false:true)

              // }
              onChange={item => {
                // console.log(accountType)
                setReadonly(false)
                setAccountType(item.value)
                setFocusDrop(false)
              }} */}
          {/* // renderLeftIcon={() => (
              //   <AntDesign
              //     style={styles.icon}
              //     color={isFocus ? 'blue' : 'black'}
              //     name="Safety"
              //     size={20}
              //   />
              // )}
            /> */}
        </View>
        {/* <ScrollView> */}

        {/* Search Component */}
        <View style={styles.searchContainer}>
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
            // onConfirmSelectItem={()=>
            //   setReadonly(accountType?false:true)

            // }
            onChange={item => {
              // console.log(accountType)
              setReadonly(false)
              setAccountType(item?.value)
              setFocusDrop(false)
            }}
          />
          <InputComponent
            readOnly={isReadonly}
            label={"Account No. / Name"}
            placeholder={"Enter Account No. / Name"}
            value={searchValue}
            handleChange={changeSearchValue}
            autoFocus={!isReadonly}
          />
        </View>
        {/* </ScrollView> */}
      </View>
    </View>
  )
}

export default MiniStatement

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.lightScheme.background,
    height: "100%",
    padding: 10,
  },
  searchContainer: {
    position: "absolute",
    top: 20,
    width: "100%",
    alignSelf: "center",
    borderColor: COLORS.lightScheme.primary,
    borderWidth: 2.5,
    backgroundColor: COLORS.lightScheme.onPrimary,
    padding: 20,
    borderRadius: 10,
    elevation: 10,
  },
  dropdownContainer: {
    backgroundColor: "white",
    position: "absolute",
    bottom: 300,
    padding: 16,
    width: "100%",
  },
  dropdown: {
    height: 50,
    borderColor: COLORS.lightScheme.primary,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
})
