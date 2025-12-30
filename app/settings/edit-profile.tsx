import { AnimatedBackground } from "@/components/AnimatedBackground";
import { borderRadius, spacing, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
   ActivityIndicator,
   Alert,
   Image,
   KeyboardAvoidingView,
   Modal,
   Platform,
   ScrollView,
   StyleSheet,
   Text,
   TextInput,
   TouchableOpacity,
   View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Generate arrays for picker options
const generateYears = () => {
  const years: number[] = [];
  for (let i = 2026; i >= 1925; i--) {
    years.push(i);
  }
  return years;
};

const generateMonths = () => [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];


// Generate days for a given month and year
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

const generateHeights = () => {
  const heights: number[] = [];
  for (let i = 100; i <= 250; i++) {
    heights.push(i);
  }
  return heights;
};

const generateWeights = () => {
  const weights: number[] = [];
  for (let i = 30; i <= 200; i++) {
    weights.push(i);
  }
  return weights;
};

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { colors, accentColor } = useSettings();
  
  const profile = useQuery(
    api.profile.getProfile,
    user ? { userId: user.id as Id<"users"> } : "skip"
  );
  
  const generateUploadUrl = useMutation(api.profile.generateUploadUrl);
  const updateProfileImage = useMutation(api.profile.updateProfileImage);
  const removeProfileImage = useMutation(api.profile.removeProfileImage);
  const updateProfile = useMutation(api.profile.updateProfile);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(70);
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState<number>(1990);
  const [birthMonth, setBirthMonth] = useState<number>(1);
  const [birthDay, setBirthDay] = useState<number>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Picker modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  
  // Temp values for pickers
  const [tempYear, setTempYear] = useState(1990);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempDay, setTempDay] = useState(1);
  const [tempHeight, setTempHeight] = useState(170);
  const [tempWeight, setTempWeight] = useState(70);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || profile.name || "");
      setBio(profile.bio || "");
      setFitnessGoal(profile.fitnessGoal || "");
      
      if (profile.height) {
        setHeight(profile.height);
        setTempHeight(profile.height);
      }
      if (profile.weight) {
        setWeight(profile.weight);
        setTempWeight(profile.weight);
      }
      
      setGender(profile.gender || "");
      
      // Parse birth date if exists
      if (profile.birthDate) {
        const parts = profile.birthDate.split("-");
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const day = parseInt(parts[2]);
          setBirthYear(year);
          setBirthMonth(month);
          setBirthDay(day);
          setTempYear(year);
          setTempMonth(month);
          setTempDay(day);
        }
      }
    }
  }, [profile]);
  
  // Format birth date for display
  const formattedBirthDate = `${generateMonths().find(m => m.value === birthMonth)?.label} ${birthDay}, ${birthYear}`;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your camera to take a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;

    setIsUploading(true);
    try {
      // Get the upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Fetch the image and convert to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": blob.type,
        },
        body: blob,
      });

      const { storageId } = await uploadResponse.json();

      // Update user profile with the new image
      await updateProfileImage({
        userId: user.id as Id<"users">,
        storageId,
      });

      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;

    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeProfileImage({
                userId: user.id as Id<"users">,
              });
              Alert.alert("Success", "Profile picture removed!");
            } catch {
              Alert.alert("Error", "Failed to remove image.");
            }
          },
        },
      ]
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      "Profile Picture",
      "Choose an option",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Library", onPress: pickImage },
        ...(profile?.profileImageUrl
          ? [{ text: "Remove Photo", onPress: handleRemovePhoto, style: "destructive" as const }]
          : []),
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Format birth date as YYYY-MM-DD
      const formattedDate = `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;
      
      await updateProfile({
        userId: user.id as Id<"users">,
        displayName: displayName || undefined,
        bio: bio || undefined,
        fitnessGoal: fitnessGoal || undefined,
        height: height || undefined,
        weight: weight || undefined,
        gender: gender || undefined,
        birthDate: formattedDate,
      });
      
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Picker handlers
  const openDatePicker = () => {
    const daysInMonth = getDaysInMonth(birthYear, birthMonth);
    setTempYear(birthYear);
    setTempMonth(birthMonth);
    setTempDay(Math.min(birthDay, daysInMonth));
    setShowDatePicker(true);
  };
  
  const confirmDatePicker = () => {
    setBirthYear(tempYear);
    setBirthMonth(tempMonth);
    setBirthDay(tempDay);
    setShowDatePicker(false);
  };
  
  const openHeightPicker = () => {
    setTempHeight(height);
    setShowHeightPicker(true);
  };
  
  const confirmHeightPicker = () => {
    setHeight(tempHeight);
    setShowHeightPicker(false);
  };
  
  const openWeightPicker = () => {
    setTempWeight(weight);
    setShowWeightPicker(true);
  };
  
  const confirmWeightPicker = () => {
    setWeight(tempWeight);
    setShowWeightPicker(false);
  };

  const fitnessGoals = [
    "Build Muscle",
    "Lose Weight",
    "Stay Fit",
    "Improve Strength",
    "Increase Endurance",
    "Flexibility",
  ];

  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Text style={[styles.saveButton, { color: accentColor }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture */}
          <View style={styles.profilePictureSection}>
            <TouchableOpacity
              style={[styles.profileImageContainer, { backgroundColor: colors.surface }]}
              onPress={showImageOptions}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="large" color={accentColor} />
              ) : profile?.profileImageUrl ? (
                <Image
                  source={{ uri: profile.profileImageUrl }}
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons name="person" size={60} color={accentColor} />
              )}
              <View style={[styles.editBadge, { backgroundColor: accentColor }]}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.changePhotoText, { color: colors.textSecondary }]}>
              Tap to change photo
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal Information
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Display Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.text },
                ]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your display name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Bio</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.text },
                ]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Birth Date
              </Text>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.surface }]}
                onPress={openDatePicker}
              >
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                  {formattedBirthDate}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Gender</Text>
              <View style={styles.optionsRow}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      { backgroundColor: colors.surface },
                      gender === option && { backgroundColor: accentColor },
                    ]}
                    onPress={() => setGender(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.text },
                        gender === option && { color: "#fff" },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Fitness Profile
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Fitness Goal
              </Text>
              <View style={styles.optionsRow}>
                {fitnessGoals.map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      styles.optionButton,
                      { backgroundColor: colors.surface },
                      fitnessGoal === goal && { backgroundColor: accentColor },
                    ]}
                    onPress={() => setFitnessGoal(goal)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.text },
                        fitnessGoal === goal && { color: "#fff" },
                      ]}
                    >
                      {goal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Height (cm)
                </Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colors.surface }]}
                  onPress={openHeightPicker}
                >
                  <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                    {height} cm
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Weight (kg)
                </Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colors.surface }]}
                  onPress={openWeightPicker}
                >
                  <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                    {weight} kg
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Email (Read-only) */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Account Information
            </Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <View
                style={[
                  styles.input,
                  styles.readOnlyInput,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text style={{ color: colors.textMuted }}>{profile?.email}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Birth Date</Text>
              <TouchableOpacity onPress={confirmDatePicker}>
                <Text style={[styles.modalDone, { color: accentColor }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerRow}>
              <View style={styles.pickerColumnEqual}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Month</Text>
                <Picker
                  selectedValue={tempMonth}
                  onValueChange={(value) => {
                    const daysInMonth = getDaysInMonth(tempYear, value);
                    setTempMonth(value);
                    setTempDay((prevDay) => Math.min(prevDay, daysInMonth));
                  }}
                  style={[styles.picker, { color: colors.text }]}
                  itemStyle={{ color: colors.text }}
                >
                  {generateMonths().map((month) => (
                    <Picker.Item key={month.value} label={month.label} value={month.value} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerColumnEqual}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Day</Text>
                <Picker
                  selectedValue={tempDay}
                  onValueChange={(value) => setTempDay(value)}
                  style={[styles.picker, { color: colors.text }]}
                  itemStyle={{ color: colors.text }}
                >
                  {Array.from({ length: getDaysInMonth(tempYear, tempMonth) }, (_, i) => i + 1).map((day) => (
                    <Picker.Item key={day} label={String(day)} value={day} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerColumnEqual}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Year</Text>
                <Picker
                  selectedValue={tempYear}
                  onValueChange={(value) => {
                    const daysInMonth = getDaysInMonth(value, tempMonth);
                    setTempYear(value);
                    setTempDay((prevDay) => Math.min(prevDay, daysInMonth));
                  }}
                  style={[styles.picker, { color: colors.text }]}
                  itemStyle={{ color: colors.text }}
                >
                  {generateYears().map((year) => (
                    <Picker.Item key={year} label={String(year)} value={year} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Height Picker Modal */}
      <Modal
        visible={showHeightPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHeightPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowHeightPicker(false)}>
                <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Height</Text>
              <TouchableOpacity onPress={confirmHeightPicker}>
                <Text style={[styles.modalDone, { color: accentColor }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.singlePickerContainer}>
              <Picker
                selectedValue={tempHeight}
                onValueChange={(value) => setTempHeight(value)}
                style={[styles.singlePicker, { color: colors.text }]}
                itemStyle={{ color: colors.text }}
              >
                {generateHeights().map((h) => (
                  <Picker.Item key={h} label={`${h} cm`} value={h} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </Modal>

      {/* Weight Picker Modal */}
      <Modal
        visible={showWeightPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWeightPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowWeightPicker(false)}>
                <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Weight</Text>
              <TouchableOpacity onPress={confirmWeightPicker}>
                <Text style={[styles.modalDone, { color: accentColor }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.singlePickerContainer}>
              <Picker
                selectedValue={tempWeight}
                onValueChange={(value) => setTempWeight(value)}
                style={[styles.singlePicker, { color: colors.text }]}
                itemStyle={{ color: colors.text }}
              >
                {generateWeights().map((w) => (
                  <Picker.Item key={w} label={`${w} kg`} value={w} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
  },
  saveButton: {
    ...typography.body,
    fontWeight: "600",
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  profilePictureSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  changePhotoText: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  formSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  readOnlyInput: {
    opacity: 0.7,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  optionText: {
    ...typography.caption,
    fontWeight: "500",
  },
  rowInputs: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  // Picker button styles
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  pickerButtonText: {
    ...typography.body,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  modalTitle: {
    ...typography.h3,
  },
  modalCancel: {
    ...typography.body,
    padding: spacing.sm,
  },
  modalDone: {
    ...typography.body,
    fontWeight: "600",
    padding: spacing.sm,
  },
  pickerRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
  },
  pickerColumnEqual: {
    flex: 1,
  },
  pickerLabel: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  picker: {
    height: 200,
  },
  singlePickerContainer: {
    paddingHorizontal: spacing.lg,
  },
  singlePicker: {
    height: 200,
  },
});
