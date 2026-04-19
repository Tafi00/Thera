import * as Notifications from "expo-notifications";
import { api } from "./api";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Check if running in Expo Go (push tokens don't work there since SDK 53)
const isExpoGo = Constants.appOwnership === "expo";

// Register for push notifications
export async function registerForPushNotifications() {
	// Push tokens are not available in Expo Go since SDK 53
	if (isExpoGo) {
		console.log(
			"Push notifications not available in Expo Go. Use a development build.",
		);
		return null;
	}

	try {
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== "granted") {
			console.log("Push notification permission denied");
			return null;
		}

		const tokenData = await Notifications.getExpoPushTokenAsync();
		const token = tokenData.data;

		// Save token to backend
		await api.post("/notification-token", {
			token,
			platform: Platform.OS,
		});

		return token;
	} catch (error) {
		console.error("Register push notifications error:", error);
		return null;
	}
}

import AsyncStorage from '@react-native-async-storage/async-storage';

// Schedule smart notifications (Daily phase + Inactivity phase)
export async function rescheduleSmartNotifications(user: any, isUnlocked: boolean) {
    try {
        // Request permissions first
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log("Quyền thông báo bị từ chối!");
            return;
        }

        const enabled = await AsyncStorage.getItem('notificationsEnabled');
        if (enabled === 'false') {
            await Notifications.cancelAllScheduledNotificationsAsync();
            return;
        }

        // Cancel existing reminders before setting new ones
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Parse preferred time
        let hour = 20;
        let minute = 0;
        if (user?.preferred_time) {
            hour = parseInt(user.preferred_time.split(':')[0]);
            minute = parseInt(user.preferred_time.split(':')[1]);
        }

        const now = new Date();
        const timeToday = new Date();
        timeToday.setHours(hour, minute, 0, 0);

        const unlockAtMs =
            user?.personalized_plan_completed_at && user?.personalized_plan_unlock_at
                ? new Date(user.personalized_plan_unlock_at).getTime()
                : null;
        const hasValidUnlockAt = typeof unlockAtMs === 'number' && !Number.isNaN(unlockAtMs);
        const isPersonalizedPhaseAt = (date: Date) =>
            hasValidUnlockAt && unlockAtMs !== null ? date.getTime() >= unlockAtMs : isUnlocked;
        const getDailyReminderContent = (date: Date) => {
            const personalizedPhase = isPersonalizedPhaseAt(date);
            return {
                title: personalizedPhase ? "Lộ trình cá nhân hóa 🧘‍♀️" : "Phục hồi chuyên sâu 🧘‍♀️",
                body: personalizedPhase
                    ? "Đã đến giờ tập lộ trình cá nhân hoá của bạn hôm nay! Bắt đầu ngay nào."
                    : "Đã đến giờ thực hiện 14 ngày phục hồi chuyên sâu! Khám phá ngay.",
            };
        };

        let startOffset = now < timeToday ? 0 : 1;

        // Day 1 and Day 2 (Normal Daily Reminders)
        for(let i = startOffset; i < startOffset + 2; i++) {
            const triggerDate = new Date();
            triggerDate.setDate(now.getDate() + i);
            triggerDate.setHours(hour, minute, 0, 0);

            const dailyContent = getDailyReminderContent(triggerDate);
            await Notifications.scheduleNotificationAsync({
                content: { ...dailyContent, sound: true },
                trigger: { date: triggerDate, type: Notifications.SchedulableTriggerInputTypes.DATE }
            });
        }

        // Day 3 Inactivity
        const day3Date = new Date();
        day3Date.setDate(now.getDate() + startOffset + 2);
        day3Date.setHours(hour, minute, 0, 0);
        await Notifications.scheduleNotificationAsync({
            content: { title: "TheraHome nhớ bạn 🥺", body: "Đã 3 ngày bạn chưa vào app để phục hồi. Hãy quay lại tập luyện để duy trì thói quen nhé!", sound: true },
            trigger: { date: day3Date, type: Notifications.SchedulableTriggerInputTypes.DATE }
        });

        // Day 5 Inactivity
        const day5Date = new Date();
        day5Date.setDate(now.getDate() + startOffset + 4);
        day5Date.setHours(hour, minute, 0, 0);
        await Notifications.scheduleNotificationAsync({
            content: { title: "Đừng bỏ cuộc! 💪", body: "5 ngày trôi qua rồi. Việc duy trì đều đặn là chìa khóa để phục hồi thành công. Vào app ngay nào!", sound: true },
            trigger: { date: day5Date, type: Notifications.SchedulableTriggerInputTypes.DATE }
        });

        // Day 7 Inactivity
        const day7Date = new Date();
        day7Date.setDate(now.getDate() + startOffset + 6);
        day7Date.setHours(hour, minute, 0, 0);
        await Notifications.scheduleNotificationAsync({
            content: { title: "Thông báo cuối cùng ⚠️", body: "Bạn đã nghỉ 1 tuần rồi. Cột sống và cơ thể đang rất cần bạn chăm sóc. Hãy bắt đầu lại từ hôm nay nhé!", sound: true },
            trigger: { date: day7Date, type: Notifications.SchedulableTriggerInputTypes.DATE }
        });

        console.log(`Smart notifications scheduled! Phase Unlocked: ${isUnlocked}`);
    } catch (error) {
        console.error("Schedule reminder error:", error);
    }
}

// Keep a backward compatible signature for settings toggle
export async function scheduleDailyReminder(hour = 8, minute = 0) {
    // Note: The Settings page toggle should preferably call rescheduleSmartNotifications directly,
    // but just in case it doesn't have `user`/`isUnlocked` context readily, we do nothing here.
    // We'll update the settings caller.
}

// Function to purely test local notification instantly
export async function triggerTestNotification() {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Test Thông Báo 🚀",
                body: "Hoạt động hiển thị thông báo đã thành công!",
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 3,
                repeats: false,
            },
        });
        console.log("Test notification scheduled immediately.");
    } catch (e) {
        console.error(e);
    }
}

// Cancel all notifications
export async function cancelAllNotifications() {
	await Notifications.cancelAllScheduledNotificationsAsync();
}

// Configure notification handler
export function configureNotifications() {
	Notifications.setNotificationHandler({
		handleNotification: async () => ({
			shouldShowAlert: true,
			shouldPlaySound: true,
			shouldSetBadge: false,
			shouldShowBanner: true,
			shouldShowList: true,
		}),
	});
}
