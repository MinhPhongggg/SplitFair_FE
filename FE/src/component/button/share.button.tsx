import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { ReactNode } from "react";
import { APP_COLOR } from "@/utils/constant";

const styles = StyleSheet.create({
  btnContainer: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: APP_COLOR.ORANGE,
  },
});

interface IProps {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  textStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  pressStyle?: StyleProp<ViewStyle>;
  loading?: boolean;
}
const ShareButton = (props: IProps) => {
  const {
    title,
    onPress,
    icon,
    textStyle,
    buttonStyle,
    pressStyle,
    loading = false,
  } = props;
  return (
    <Pressable
      disabled={loading}
      style={({ pressed }) => [
        {
          opacity: pressed === true || loading ? 0.5 : 1,
          alignSelf: "flex-start", //fit-content
        },
        pressStyle,
      ]}
      onPress={onPress}
    >
      <View style={[styles.btnContainer, buttonStyle]}>
        {loading && <ActivityIndicator color={"black"} />}
        {icon}
        <Text style={textStyle}>{title}</Text>
      </View>
    </Pressable>
  );
};

export default ShareButton;
