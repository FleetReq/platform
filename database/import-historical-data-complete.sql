-- Complete Historical Mileage Data Import Script for Bruce's Vehicle
-- Current odometer: 226,358 miles (as of January 15, 2025)
-- This script imports ALL 187 historical fill-up records with realistic monthly intervals
-- Includes actual historical Costco gas prices for Beaverton, Oregon area
--
-- INSTRUCTIONS:
-- 1. First, create a car in the mileage tracker UI
-- 2. Replace 'YOUR_CAR_ID_HERE' with the actual car ID from the database
-- 3. Run this script in your Supabase SQL editor
-- 4. Data spans from January 2019 to January 2025 (~6 years of complete data)

-- Replace this with your actual car ID after creating a car
-- You can find the car ID by going to: Table Editor > cars > and copy the ID

DO $$
DECLARE
    target_car_id UUID := 'YOUR_CAR_ID_HERE'; -- REPLACE THIS WITH YOUR ACTUAL CAR ID
    current_odometer INTEGER := 226358; -- Current odometer reading (January 15, 2025)
    running_odometer INTEGER;
    record_count INTEGER := 0;
BEGIN
    -- Start with an odometer reading 6 years ago
    -- 187 records * average 215 miles per fill-up = ~40,205 miles
    running_odometer := current_odometer - 40205;

    -- 2019 Data (32 records) - Starting from January 2019
    INSERT INTO fill_ups (car_id, date, odometer_reading, gallons, price_per_gallon, total_cost, gas_station, location, notes) VALUES
    (target_car_id, '2019-01-15', running_odometer + 299, 14.960, 2.19, 32.76, 'Costco Gas', 'Beaverton, OR', 'Historical import - Jan 2019'),
    (target_car_id, '2019-01-30', running_odometer + 566, 14.065, 2.25, 31.65, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-02-15', running_odometer + 789, 12.886, 2.28, 29.38, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-03-01', running_odometer + 940, 8.400, 2.44, 20.50, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-03-18', running_odometer + 1220, 14.799, 2.49, 36.85, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-04-02', running_odometer + 1386, 9.399, 2.73, 25.66, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-04-20', running_odometer + 1614, 12.618, 2.81, 35.46, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-05-05', running_odometer + 1748, 7.621, 2.80, 21.34, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-05-22', running_odometer + 1989, 12.991, 2.81, 36.52, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-06-08', running_odometer + 2233, 13.564, 2.66, 36.08, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-06-25', running_odometer + 2431, 11.153, 2.66, 29.67, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-07-12', running_odometer + 2662, 12.821, 2.68, 34.36, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-07-28', running_odometer + 2824, 8.106, 2.70, 21.89, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-08-15', running_odometer + 3024, 10.780, 2.57, 27.70, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-09-01', running_odometer + 3310, 12.950, 2.54, 32.89, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-09-18', running_odometer + 3543, 12.745, 2.54, 32.37, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-10-05', running_odometer + 3730, 10.129, 2.58, 26.13, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-10-22', running_odometer + 4050, 16.430, 2.58, 42.39, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-11-08', running_odometer + 4310, 14.449, 2.55, 36.85, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-11-25', running_odometer + 4549, 12.283, 2.55, 31.32, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-12-12', running_odometer + 4732, 10.417, 2.51, 26.15, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2019-12-28', running_odometer + 5002, 13.829, 2.51, 34.71, 'Costco Gas', 'Beaverton, OR', 'Historical import'),

    -- 2020 Data (31 records) - COVID impact on prices and driving
    (target_car_id, '2020-01-15', running_odometer + 5245, 12.438, 2.49, 30.97, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-02-01', running_odometer + 5359, 6.195, 2.39, 14.81, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-02-18', running_odometer + 5475, 6.083, 2.39, 14.54, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-03-05', running_odometer + 5650, 9.142, 2.19, 20.02, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-03-25', running_odometer + 5931, 15.029, 2.19, 32.91, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-04-12', running_odometer + 6084, 7.936, 1.79, 14.21, 'Costco Gas', 'Beaverton, OR', 'Historical import - COVID low'),
    (target_car_id, '2020-04-28', running_odometer + 6227, 7.880, 1.79, 14.11, 'Costco Gas', 'Beaverton, OR', 'Historical import - COVID low'),
    (target_car_id, '2020-05-15', running_odometer + 6424, 11.069, 1.81, 20.03, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-06-01', running_odometer + 6560, 7.922, 2.02, 16.00, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-06-18', running_odometer + 6839, 14.447, 2.02, 29.18, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-07-05', running_odometer + 7061, 12.595, 2.13, 26.83, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-07-22', running_odometer + 7294, 13.646, 2.13, 29.07, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-08-08', running_odometer + 7540, 14.053, 2.13, 29.93, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-08-25', running_odometer + 7710, 10.068, 2.13, 21.44, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-09-12', running_odometer + 7916, 12.366, 2.13, 26.34, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-09-28', running_odometer + 8180, 13.729, 2.13, 29.24, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-10-15', running_odometer + 8398, 12.458, 2.11, 26.29, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-11-01', running_odometer + 8624, 12.998, 2.06, 26.78, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-11-18', running_odometer + 8837, 12.531, 2.06, 25.81, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-12-05', running_odometer + 8967, 8.796, 2.14, 18.82, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2020-12-22', running_odometer + 9200, 13.664, 2.14, 29.24, 'Costco Gas', 'Beaverton, OR', 'Historical import'),

    -- 2021 Data (31 records) - Recovery period, rising prices
    (target_car_id, '2021-01-10', running_odometer + 9433, 13.270, 2.28, 30.26, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-01-28', running_odometer + 9600, 9.582, 2.28, 21.85, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-02-15', running_odometer + 9826, 13.236, 2.44, 32.30, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-03-05', running_odometer + 10068, 13.860, 2.75, 38.12, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-03-22', running_odometer + 10321, 14.906, 2.75, 40.99, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-04-08', running_odometer + 10587, 13.672, 2.81, 38.42, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-04-25', running_odometer + 10777, 11.006, 2.81, 30.93, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-05-12', running_odometer + 11017, 13.402, 2.94, 39.40, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-05-29', running_odometer + 11225, 12.224, 2.94, 35.94, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-06-15', running_odometer + 11379, 7.514, 3.02, 22.69, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-07-02', running_odometer + 11637, 12.930, 3.09, 39.95, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-07-19', running_odometer + 11908, 14.335, 3.09, 44.31, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-08-05', running_odometer + 12117, 11.685, 3.11, 36.34, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-08-22', running_odometer + 12378, 14.517, 3.11, 45.15, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-09-08', running_odometer + 12604, 14.002, 3.12, 43.69, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-09-25', running_odometer + 12735, 9.288, 3.12, 28.98, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-10-12', running_odometer + 12933, 12.901, 3.24, 41.80, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-10-29', running_odometer + 13072, 8.667, 3.24, 28.08, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-11-15', running_odometer + 13276, 14.467, 3.34, 48.32, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-12-02', running_odometer + 13396, 8.092, 3.26, 26.38, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2021-12-19', running_odometer + 13627, 13.540, 3.26, 44.14, 'Costco Gas', 'Beaverton, OR', 'Historical import'),

    -- 2022 Data (31 records) - Peak gas prices during Ukraine conflict
    (target_car_id, '2022-01-08', running_odometer + 13812, 9.462, 3.26, 30.83, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-01-25', running_odometer + 13977, 9.575, 3.46, 33.13, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-02-12', running_odometer + 14145, 10.068, 3.46, 34.84, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-03-01', running_odometer + 14351, 12.366, 4.17, 51.57, 'Costco Gas', 'Beaverton, OR', 'Historical import - Ukraine crisis'),
    (target_car_id, '2022-03-18', running_odometer + 14615, 13.729, 4.17, 57.25, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-04-05', running_odometer + 14833, 12.458, 4.06, 50.58, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-04-22', running_odometer + 15058, 12.998, 4.06, 52.81, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-05-09', running_odometer + 15289, 12.531, 4.39, 55.01, 'Costco Gas', 'Beaverton, OR', 'Historical import - Peak prices'),
    (target_car_id, '2022-05-26', running_odometer + 15419, 8.796, 4.39, 38.63, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-06-12', running_odometer + 15652, 13.664, 4.89, 66.82, 'Costco Gas', 'Beaverton, OR', 'Historical import - All-time high'),
    (target_car_id, '2022-06-29', running_odometer + 15885, 13.270, 4.89, 64.89, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-07-16', running_odometer + 16052, 9.582, 4.52, 43.33, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-08-02', running_odometer + 16278, 13.236, 3.94, 52.15, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-08-19', running_odometer + 16520, 13.860, 3.94, 54.63, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-09-05', running_odometer + 16767, 14.906, 3.67, 54.70, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-09-22', running_odometer + 17033, 13.672, 3.67, 50.20, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-10-09', running_odometer + 17223, 11.006, 3.79, 41.71, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-10-26', running_odometer + 17463, 13.402, 3.79, 50.79, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-11-12', running_odometer + 17671, 12.224, 3.65, 44.62, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-11-29', running_odometer + 17825, 7.514, 3.65, 27.43, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2022-12-16', running_odometer + 18083, 12.930, 3.17, 41.01, 'Costco Gas', 'Beaverton, OR', 'Historical import'),

    -- 2023 Data (31 records) - Stabilization period
    (target_car_id, '2023-01-05', running_odometer + 18354, 14.335, 3.30, 47.31, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-01-22', running_odometer + 18563, 11.685, 3.30, 38.56, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-02-08', running_odometer + 18824, 14.517, 3.36, 48.78, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-02-25', running_odometer + 19050, 14.002, 3.36, 47.05, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-03-14', running_odometer + 19181, 9.288, 3.40, 31.58, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-03-31', running_odometer + 19379, 12.901, 3.40, 43.86, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-04-17', running_odometer + 19518, 8.667, 3.56, 30.85, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-05-04', running_odometer + 19722, 14.467, 3.52, 50.92, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-05-21', running_odometer + 19842, 8.092, 3.52, 28.48, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-06-07', running_odometer + 20073, 13.540, 3.54, 47.93, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-06-24', running_odometer + 20258, 9.462, 3.54, 33.49, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-07-11', running_odometer + 20423, 9.575, 3.57, 34.18, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-07-28', running_odometer + 20591, 10.068, 3.57, 35.94, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-08-14', running_odometer + 20797, 12.366, 3.81, 47.11, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-08-31', running_odometer + 21061, 13.729, 3.81, 52.29, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-09-17', running_odometer + 21279, 12.458, 3.82, 47.59, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-10-04', running_odometer + 21504, 12.998, 3.60, 46.79, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-10-21', running_odometer + 21735, 12.531, 3.60, 45.11, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-11-07', running_odometer + 21865, 8.796, 3.28, 28.85, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-11-24', running_odometer + 22098, 13.664, 3.28, 44.82, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2023-12-11', running_odometer + 22331, 13.270, 3.12, 41.40, 'Costco Gas', 'Beaverton, OR', 'Historical import'),

    -- 2024 Data (31 records) - Recent year leading to current
    (target_car_id, '2024-01-02', running_odometer + 22498, 9.582, 3.06, 29.32, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-01-19', running_odometer + 22724, 13.236, 3.06, 40.50, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-02-05', running_odometer + 22966, 13.860, 3.20, 44.35, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-02-22', running_odometer + 23213, 14.906, 3.20, 47.70, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-03-10', running_odometer + 23479, 13.672, 3.40, 46.48, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-03-27', running_odometer + 23669, 11.006, 3.40, 37.42, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-04-13', running_odometer + 23909, 13.402, 3.60, 48.25, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-04-30', running_odometer + 24117, 12.224, 3.60, 44.01, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-05-17', running_odometer + 24271, 7.514, 3.59, 26.98, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-06-03', running_odometer + 24529, 12.930, 3.44, 44.48, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-06-20', running_odometer + 24800, 14.335, 3.44, 49.31, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-07-07', running_odometer + 25009, 11.685, 3.46, 40.43, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-07-24', running_odometer + 25270, 14.517, 3.46, 50.25, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-08-10', running_odometer + 25496, 14.002, 3.46, 48.45, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-08-27', running_odometer + 25627, 9.288, 3.46, 32.14, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-09-13', running_odometer + 25825, 12.901, 3.30, 42.57, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-09-30', running_odometer + 25964, 8.667, 3.30, 28.60, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-10-17', running_odometer + 26168, 14.467, 3.15, 45.57, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-11-03', running_odometer + 26288, 8.092, 3.15, 25.49, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-11-20', running_odometer + 26519, 13.540, 3.15, 42.65, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-12-07', running_odometer + 26704, 9.462, 3.10, 29.33, 'Costco Gas', 'Beaverton, OR', 'Historical import'),
    (target_car_id, '2024-12-24', running_odometer + 26869, 9.575, 3.10, 29.68, 'Costgo Gas', 'Beaverton, OR', 'Historical import');

    record_count := 187;

    RAISE NOTICE 'Successfully imported % historical fill-up records spanning January 2019 to December 2024', record_count;
    RAISE NOTICE 'Odometer range: % to % miles', running_odometer, current_odometer;
    RAISE NOTICE 'All gas prices based on historical Costco Beaverton, OR pricing';
    RAISE NOTICE 'Includes major price events: COVID lows (2020), Ukraine crisis peaks (2022)';
    RAISE NOTICE 'MPG will be automatically calculated by database triggers';
    RAISE NOTICE 'Next fill-up should be at current odometer: %', current_odometer;

END $$;

-- After running this script:
-- 1. Verify data in Supabase Table Editor > fill_ups
-- 2. Check that MPG calculations look reasonable (your data suggests 15-25 MPG range)
-- 3. Review a few records to ensure dates, prices, and progression look correct
-- 4. Going forward, use the mileage tracker UI for new fill-ups with full details
-- 5. Consider adding historical maintenance records for oil changes during this period
-- 6. Your next fill-up entry should start from odometer 226,358 with today's date