# Maintenance Intervals & Status Indicators

This document explains the maintenance tracking system, including default intervals and color-coded status indicators.

## 🚨 Color-Coded Status System

The maintenance status uses a traffic light system to indicate when service is due:

- **🟢 Green (Good)**: Service is current and within normal intervals
- **🟡 Yellow (Warning)**: Service is approaching due date (caution zone)
- **🔴 Red (Overdue)**: Service is past due and should be performed immediately
- **⚫ Gray (Unknown)**: No maintenance records found for this service type

## 📅 Default Maintenance Intervals

### Oil Change 🛢️
- **Interval**: Every 6 months OR 5,000 miles (whichever comes first)
- **Yellow Warning**: At 80% (4.8 months OR 4,000 miles)
- **Red Overdue**: At 100% (6 months OR 5,000 miles)
- **Notes**: Interval may vary based on oil type (conventional vs synthetic)

### Tire Rotation 🔄
- **Interval**: Every 6 months OR 7,500 miles (whichever comes first)
- **Yellow Warning**: At 80% (4.8 months OR 6,000 miles)
- **Red Overdue**: At 100% (6 months OR 7,500 miles)
- **Notes**: Helps ensure even tire wear and extends tire life

### Brake Inspection 🛑
- **Interval**: Every 12 months OR 12,000 miles (whichever comes first)
- **Yellow Warning**: At 80% (9.6 months OR 9,600 miles)
- **Red Overdue**: At 100% (12 months OR 12,000 miles)
- **Notes**: Critical safety component requiring regular inspection

### Air Filter 🌬️
- **Interval**: Every 12 months OR 15,000 miles (whichever comes first)
- **Yellow Warning**: At 80% (9.6 months OR 12,000 miles)
- **Red Overdue**: At 100% (12 months OR 15,000 miles)
- **Notes**: Affects engine performance and fuel efficiency

### Transmission Service ⚙️
- **Interval**: Every 24 months OR 30,000 miles (whichever comes first)
- **Yellow Warning**: At 80% (19.2 months OR 24,000 miles)
- **Red Overdue**: At 100% (24 months OR 30,000 miles)
- **Notes**: Includes fluid change and filter replacement

### Coolant Flush 🧊
- **Interval**: Every 24 months OR 30,000 miles (whichever comes first)
- **Yellow Warning**: At 80% (19.2 months OR 24,000 miles)
- **Red Overdue**: At 100% (24 months OR 30,000 miles)
- **Notes**: Prevents overheating and corrosion

### Wipers 🌧️
- **Interval**: Every 12 months (time-based only)
- **Yellow Warning**: At 75% (9 months)
- **Red Overdue**: At 100% (12 months)
- **Notes**: Replace when streaking, skipping, or cracked

### Registration 📋
- **Interval**: Every 24 months (time-based only)
- **Yellow Warning**: At 90% (21.6 months)
- **Red Overdue**: At 100% (24 months)
- **Notes**: Vehicle registration renewal requirement

## 🔧 How the System Works

### Dual-Criteria Evaluation
Most maintenance items are evaluated on both time and mileage:
- The system takes the **most urgent status** between time and mileage
- If either criterion reaches the warning or overdue threshold, that status is shown
- Example: If your oil change is due in 2 months by time but overdue by mileage, it shows **Red (Overdue)**

### Time-Only Services
Some services (Wipers, Registration) are evaluated on time only:
- No mileage component affects the status
- Based purely on the date of last service

### No Records = Overdue
If no maintenance record exists for a service type:
- Status shows as **Red (Overdue)** to encourage initial service entry
- Once you add a maintenance record, the system begins tracking intervals

## 📊 Status Calculation Examples

### Example 1: Oil Change
- Last oil change: 4 months ago at 220,000 miles
- Current mileage: 224,500 miles
- **Time status**: 4/6 months = 67% (🟢 Green)
- **Mileage status**: 4,500/5,000 miles = 90% (🔴 Red - exceeds 80% threshold)
- **Final status**: 🔴 Red (takes most urgent)

### Example 2: Wipers
- Last wiper replacement: 8 months ago
- **Time status**: 8/12 months = 67% (🟢 Green)
- **Final status**: 🟢 Green (no mileage component)

### Example 3: Registration
- Last registration: 22 months ago
- **Time status**: 22/24 months = 92% (🔴 Red - exceeds 90% threshold)
- **Final status**: 🔴 Red (time-based only)

## 🎯 Best Practices

1. **Add maintenance records promptly** after service to ensure accurate tracking
2. **Include odometer readings** when possible for mileage-based calculations
3. **Check status regularly** - the dashboard updates automatically based on current date/mileage
4. **Address yellow warnings** proactively to avoid emergency situations
5. **Use the notes field** to track specific details about services performed

## 📱 User Interface

The maintenance status appears in the vehicle analytics dashboard as a 2x4 grid showing all eight maintenance categories. Each item displays:
- Service type name and icon
- Color-coded border and background
- Current status based on the calculation above

The system automatically updates as time passes and as you add new maintenance records or update your vehicle's current mileage.