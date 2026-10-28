
const { google } = require("googleapis");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      message: "Phương thức không được hỗ trợ."
    });
  }

  try {
    const body = req.body || {};

    const fullName =
      typeof body.full_name === "string"
        ? body.full_name.trim()
        : "";

    const guestOf =
      typeof body.bancuadaure === "string"
        ? body.bancuadaure.trim()
        : "";

    const wish =
      typeof body.guiloichuc === "string"
        ? body.guiloichuc.trim()
        : "";

    const attendance =
      typeof body.ban_se_tham_du_chu === "string"
        ? body.ban_se_tham_du_chu
        : "";

    const validAttendance = [
      "Có, chắc chắc tôi sẽ đến",
      "Xin lỗi, tôi bận mất rồi"
    ];

    if (!fullName || fullName.length > 150) {
      return res.status(400).json({
        message: "Vui lòng nhập tên hợp lệ."
      });
    }

    if (
      guestOf.length > 200 ||
      wish.length > 5000 ||
      !validAttendance.includes(attendance)
    ) {
      return res.status(400).json({
        message: "Thông tin gửi lên không hợp lệ."
      });
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail =
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey =
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!spreadsheetId || !clientEmail || !privateKey) {
      throw new Error("Thiếu cấu hình Google Sheets.");
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets"
      ]
    });

    const sheets = google.sheets({
      version: "v4",
      auth
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Responses!A:E",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[
          new Date().toISOString(),
          fullName,
          guestOf,
          wish,
          attendance
        ]]
      }
    });

    return res.status(200).json({
      success: true,
      message: "Gửi thông tin thành công!"
    });

  } catch (error) {
    console.error("Lỗi lưu RSVP:", error);

    return res.status(500).json({
      message: "Không thể lưu thông tin. Vui lòng thử lại."
    });
  }
};
