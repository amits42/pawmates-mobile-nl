import { useNavigation } from "@react-navigation/native";
import { styled } from "nativewind";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/auth-context"; // adapt path

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchable = styled(TouchableOpacity);

export default function LoginScreen() {
    const navigation = useNavigation();
    const { user, verifyOTP } = useAuth();

    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOTP] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [demoOTP, setDemoOTP] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.isAuthenticated) {
            navigation.navigate("Home"); // redirect to your main app screen
        }
    }, [user]);

    const handleSendOTP = async () => {
        setError(""); setSuccess(""); setLoading(true);
        if (!/^[6-9]\d{9}$/.test(phone)) {
            setError("Enter valid 10-digit Indian phone number");
            setLoading(false);
            return;
        }
        try {
            const res = await fetch("YOUR_API/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: `+91${phone}` }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(data.message);
                setStep("otp");
                if (data.developmentOTP) setDemoOTP(data.developmentOTP);
            } else setError(data.message || "Failed to send OTP");
        } catch {
            setError("Network error");
        } finally { setLoading(false); }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            setError("Enter valid 6-digit OTP");
            return;
        }
        setLoading(true);
        try {
            await verifyOTP(`+91${phone}`, otp, "pet_owner");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to verify OTP");
        } finally { setLoading(false); }
    };

    return (
        <ScrollView className="flex-1 bg-zubo-background p-4 justify-center">
            <StyledView className="items-center mb-8">
                <Image source={require("../assets/logo.png")} className="w-32 h-32" />
                <StyledText className="text-2xl font-bold text-zubo-text mt-2">Welcome Back</StyledText>
                <StyledText className="text-gray-600">Sign in to your ZuboPets account</StyledText>
            </StyledView>

            <StyledView className="bg-white p-4 rounded-lg shadow-md">
                {step === "phone" ? (
                    <>
                        <StyledText className="text-zubo-text font-medium mb-2">Phone Number</StyledText>
                        <StyledView className="flex-row items-center border border-gray-300 rounded-md mb-4">
                            <StyledText className="px-3 text-gray-600">+91</StyledText>
                            <StyledTextInput
                                className="flex-1 p-2"
                                placeholder="9876543210"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </StyledView>
                        {error ? <StyledText className="text-red-600 mb-2">{error}</StyledText> : null}
                        {success ? <StyledText className="text-green-600 mb-2">{success}</StyledText> : null}
                        <StyledTouchable
                            className="bg-zubo-primary p-3 rounded-md items-center"
                            onPress={handleSendOTP}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <StyledText className="text-white font-semibold">Send OTP</StyledText>}
                        </StyledTouchable>
                    </>
                ) : (
                    <>
                        <StyledText className="text-zubo-text font-medium mb-2">Enter OTP</StyledText>
                        <StyledTextInput
                            className="border border-gray-300 p-2 rounded-md mb-4 text-center text-xl tracking-widest"
                            keyboardType="numeric"
                            maxLength={6}
                            value={otp}
                            onChangeText={(t) => setOTP(t.replace(/\D/g, ""))}
                        />
                        {demoOTP ? <StyledText className="mb-2 text-zubo-text">Your OTP: {demoOTP}</StyledText> : null}
                        {error ? <StyledText className="text-red-600 mb-2">{error}</StyledText> : null}
                        {success ? <StyledText className="text-green-600 mb-2">{success}</StyledText> : null}

                        <StyledTouchable className="bg-zubo-primary p-3 rounded-md items-center mb-2" onPress={handleVerifyOTP} disabled={loading}>
                            {loading ? <ActivityIndicator color="white" /> : <StyledText className="text-white font-semibold">Verify OTP</StyledText>}
                        </StyledTouchable>
                        <StyledTouchable className="p-3 items-center" onPress={() => setStep("phone")}>
                            <StyledText className="text-zubo-primary">Change Phone Number</StyledText>
                        </StyledTouchable>
                    </>
                )}
            </StyledView>
        </ScrollView>
    );
}
