import { useCallback } from "react";

export function useNotification() {
  const fireNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      // Check if the browser supports notifications
      if (!("Notification" in window)) {
        console.log("This browser does not support notifications.");
        return;
      }

      let notification = null;

      if (Notification?.permission === "granted") {
        notification = new Notification(title, options);
      } else if (Notification?.permission !== "denied") {
        Notification.requestPermission().then((status) => {
          // If the user said okay
          if (status === "granted") {
            notification = new Notification(title, options);
          } else {
            // Otherwise, we can fallback to a regular modal alert
            console.log("User denied the permission request.");
          }
        });
      } else {
        console.log("The site does not have permission to show notifications.");
      }
    },
    []
  );

  return {
    fireNotification,
  };
}
