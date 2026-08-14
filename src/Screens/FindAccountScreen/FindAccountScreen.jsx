import {
  ActivityIndicator,
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useCallback, useContext, useEffect, useState } from "react"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS, colors } from "../../Resources/colors"
import InputComponent from "../../Components/InputComponent"
import SearchCard from "../../Components/SearchCard"
import axios from "axios"
import { REACT_APP_BASE_URL } from "../../Config/config"
import { address } from "../../Routes/addresses"
import { AppStore } from "../../Context/AppContext"
import { useFocusEffect } from "@react-navigation/native"

const FindAccountScreen = ({ navigation }) => {
  const [searchValue, changeSearchValue] = useState(() => "")
  const [userBankDetails, setUserBankDetails] = useState(() => [])
  const [isLoading, setIsLoading] = useState(false)

  const { userId, bankId, branchCode } = useContext(AppStore)

  // function handleAccountSearch() {
  //   if (!searchValue) {
  //     return
  //   }
  //   fetchBankDetails()
  // }

  const debounce = func => {
    let timer
    return function (...args) {
      // console.log(args)
      const context = this
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        func.apply(context, args)
      }, 2000)
    }
  }

  // useEffect(() => {
  //   handleAccountSearch()
  //   console.log(userBankDetails)
  // }, [searchValue])

  useEffect(() => {
    if (!searchValue) return;
    const handler = setTimeout(() => {
      fetchBankDetails();
    }, 800); // debounce 800ms
    return () => clearTimeout(handler);
  }, [searchValue]);

  const fetchBankDetails = async () => {
    setIsLoading(true)
    const obj = {
      bank_id: bankId,
      branch_code: branchCode,
      agent_code: userId,
      account_number: searchValue,
      flag: "D",
    }
    await axios
      .post(address.SEARCH_ACCOUNT, obj, {
        headers: {
          Accept: "application/json",
        },
      })
      .then(res => {
        setIsLoading(false)
        setUserBankDetails(res?.data?.success?.msg)
      })
      .catch(err => {
        setIsLoading(false)
        setUserBankDetails([])
        console.log("error: " + err?.response?.data)
      })
  }

  useFocusEffect(
    useCallback(() => {
      return () => {
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
        <Text style={styles.title}>Daily</Text>
        {/* {isLoading} */}
        {isLoading && (
          <ActivityIndicator
            color={COLORS.lightScheme.primary}
            style={styles.loading}
            size={"large"}
          />
        )}

        <ScrollView
          style={{ maxHeight: "60%", top: 150}}
          keyboardShouldPersistTaps="handled">
          {userBankDetails &&
            userBankDetails?.map((props, index) => {
              // console.log("========================", props)
              return (
                <SearchCard
                  item={props}
                  index={index}
                  navigation={navigation}
                  key={index}
                  flag={"D"}
                />
              )
            })}
        </ScrollView>
        {/* Search Component */}
        <View style={styles.searchContainer}>
          <InputComponent
            label={"Account No. / Name"}
            placeholder={"Enter Account No. / Name"}
            value={searchValue}
            handleChange={changeSearchValue}
            autoFocus={true}
          />
        </View>
      </View>
    </View>
  )
}

export default FindAccountScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.lightScheme.background,
    height: "100%",
    padding: 10,
  },
  searchContainer: {
    position: "absolute",
    top: 50,
    width: "100%",
    alignSelf: "center",
    borderColor: COLORS.lightScheme.primary,
    borderWidth: 2,
    backgroundColor: COLORS.lightScheme.onPrimary,
    padding: 20,
    borderRadius: 10,
    elevation: 10,
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
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  loading: {
    color: COLORS.lightScheme.tertiaryContainer,
    marginTop: 50,
  },
})
