import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import React from "react"
import { COLORS, colors } from "../Resources/colors"
import mainNavigationRoutes from "../Routes/NavigationRoutes"
import { icon } from "../Resources/Icons"

const SearchCard = ({ item, index, navigation, flag }) => {
  // console.log("flag" + flag)
  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate(
          flag == "D"
            ? mainNavigationRoutes.accountDetails
            : flag == "R"
              ? mainNavigationRoutes.RDAccountDetails
              : mainNavigationRoutes.loanAccountDetails,
          { item: item },
        )
      }
      style={styles.container}
      key={index}>
      <View>
        <Image
          source={{
            uri: "https://static.wikia.nocookie.net/artemisfowl/images/8/89/Portrait_Placeholder.png/revision/latest/thumbnail/width/360/height/450?cb=20190630050130",
          }}
          style={styles.image}
        />
      </View>
      <View>
        <Text style={styles.head}>{item?.customer_name}</Text>
        <Text style={styles.text}>Account No : {item?.account_number}</Text>
        <Text style={styles.text}>
          Account Type :{" "}
          {item?.acc_type == "D"
            ? "Daily"
            : item?.acc_type == "R"
              ? "RD"
              : item?.acc_type == "L"
                ? "Loan"
                : ""}
        </Text>
        <Text style={styles.text}>Product Code : {item?.product_code}</Text>
      </View>
      <View style={styles.arrow}>
        <Text>{icon.right(COLORS.lightScheme.primary, 45)}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default SearchCard

const styles = StyleSheet.create({
  container: {
    width: "99%",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginVertical: 10,
    elevation: 15,
    borderBottomColor: COLORS.lightScheme.primary,
    border: 1,
  },
  head: {
    color: COLORS.lightScheme.primary,
    padding: 5,
    fontWeight: "bold",
    fontSize: 18,
    maxWidth: 300,
  },
  arrow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  text: {
    color: COLORS.lightScheme.primary,
    padding: 2,
    fontWeight: "500",
    fontSize: 14,
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 100,
    marginRight: 10,
  },
})
