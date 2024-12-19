const transformGrowthData = (data, type, dataType) => {
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	// Helper function to format date parts
	const formatDate = (dateStr) => {
		const date = new Date(dateStr);
		return {
			day: date.getDate(),
			month: months[date.getMonth()],
			year: date.getFullYear(),
			dayName: days[date.getDay()],
		};
	};

	// Helper to get the last day of month
	const getLastDayOfMonth = (year, month) => {
		return new Date(year, month + 1, 0).getDate();
	};

	// Helper to get count for a specific date
	const getCountForDate = (date) => {
		return data.find((d) => d._id === date)?.count || 0;
	};

	switch (type) {
		case "overall": {
			if (!data.length) return [];

			const sortedDates = [...new Set(data.map((d) => d._id))].sort();
			const startDate = new Date(sortedDates[0]);
			const endDate = new Date(sortedDates[sortedDates.length - 1]);
			const result = [];

			let currentDate = new Date(startDate);
			currentDate.setDate(1);

			while (currentDate <= endDate) {
				const year = currentDate.getFullYear();
				const month = currentDate.getMonth();

				const monthlyCount = data.reduce((total, item) => {
					const itemDate = new Date(item._id);
					if (itemDate.getFullYear() === year && itemDate.getMonth() === month) {
						return total + item.count;
					}
					return total;
				}, 0);

				result.push({
					label: `${months[month]} ${year % 100}`,
					[dataType]: monthlyCount,
				});

				currentDate.setMonth(currentDate.getMonth() + 1);
			}

			return result;
		}

		case "yearly": {
			const currentYear = new Date().getFullYear();
			const result = [];

			for (let month = 0; month < 12; month++) {
				const monthData = {
					label: `${months[month]}`,
					[dataType]: 0,
				};

				data.forEach((item) => {
					const itemDate = new Date(item._id);
					if (itemDate.getFullYear() === currentYear && itemDate.getMonth() === month) {
						monthData[dataType] += item.count;
					}
				});

				result.push(monthData);
			}
			return result;
		}

		case "monthly": {
			const result = [];
			const currentDate = new Date();
			const currentMonth = currentDate.getMonth();
			const currentYear = currentDate.getFullYear();
			const lastDay = getLastDayOfMonth(currentYear, currentMonth);

			for (let day = 1; day <= lastDay; day += 7) {
				const endWeekDay = Math.min(day + 6, lastDay);
				const weekData = {
					label: `${day}-${endWeekDay} ${months[currentMonth]}`,
					[dataType]: 0,
				};

				for (let d = day; d <= endWeekDay; d++) {
					const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
						2,
						"0"
					)}-${String(d).padStart(2, "0")}`;
					weekData[dataType] += getCountForDate(dateStr);
				}

				result.push(weekData);
			}
			return result;
		}

		case "weekly": {
			const result = [];
			const now = new Date();
			const currentDay = now.getDay();

			const startOfWeek = new Date(now);
			const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;

			startOfWeek.setDate(now.getDate() - daysToSubtract);
			startOfWeek.setHours(0, 0, 0, 0);

			for (let i = 0; i < 7; i++) {
				const currentDate = new Date(startOfWeek);
				currentDate.setDate(startOfWeek.getDate() + i);

				const dateStr = currentDate.toISOString().split("T")[0];
				const { dayName } = formatDate(dateStr);

				result.push({
					label: dayName,
					[dataType]: getCountForDate(dateStr),
				});
			}

			return result;
		}

		default:
			return [];
	}
};

module.exports = transformGrowthData;
