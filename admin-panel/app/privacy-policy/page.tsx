import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật - TheraHome",
  description: "Chính sách bảo mật của ứng dụng TheraHome",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 sm:p-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Chính sách bảo mật
          </h1>
          <p className="mt-2 text-gray-500">
            Cập nhật lần cuối: 10 tháng 5, 2025
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              1. Giới thiệu
            </h2>
            <p className="text-gray-600 leading-relaxed">
              TheraHome (&quot;chúng tôi&quot;, &quot;của chúng tôi&quot;) cam kết bảo vệ quyền riêng tư của bạn. 
              Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ 
              thông tin cá nhân của bạn khi bạn sử dụng ứng dụng TheraHome.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              2. Thông tin chúng tôi thu thập
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Chúng tôi thu thập các loại thông tin sau:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Thông tin tài khoản:</strong> Tên, email, ảnh đại diện (thông qua Google Sign-In, Sign in with Apple hoặc Facebook Login)
              </li>
              <li>
                <strong>Thông tin hồ sơ sức khỏe:</strong> Tuổi, giới tính, nghề nghiệp, vùng đau, 
                triệu chứng, tiền sử phẫu thuật, thời gian tập luyện ưa thích
              </li>
              <li>
                <strong>Dữ liệu sử dụng:</strong> Lịch sử tập luyện, mức độ đau hàng ngày, 
                lượng nước uống, tiến trình phục hồi
              </li>
              <li>
                <strong>Thông tin thiết bị:</strong> Danh sách thiết bị TheraHome đã kích hoạt
              </li>
              <li>
                <strong>Lịch sử trò chuyện:</strong> Nội dung trao đổi với trợ lý AI
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              3. Mục đích sử dụng thông tin
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Chúng tôi sử dụng thông tin của bạn để:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Cá nhân hóa bài tập và lộ trình phục hồi phù hợp với tình trạng của bạn</li>
              <li>Theo dõi tiến trình sức khỏe và cung cấp phân tích xu hướng đau</li>
              <li>Gửi thông báo nhắc nhở tập luyện và uống nước</li>
              <li>Cải thiện chất lượng tư vấn của trợ lý AI</li>
              <li>Gợi ý thiết bị TheraHome phù hợp với vùng đau</li>
              <li>Cải thiện và phát triển ứng dụng</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              4. Chia sẻ thông tin
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi <strong>không bán</strong> thông tin cá nhân của bạn cho bên thứ ba. 
              Thông tin của bạn chỉ được chia sẻ trong các trường hợp sau:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>Với nhà cung cấp dịch vụ đám mây để lưu trữ dữ liệu an toàn (MongoDB Atlas)</li>
              <li>Với Google, Apple hoặc Facebook để xác thực tài khoản (Google Sign-In, Sign in with Apple hoặc Facebook Login)</li>
              <li>Khi được yêu cầu bởi pháp luật hoặc cơ quan có thẩm quyền</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              5. Bảo mật dữ liệu
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ 
              thông tin cá nhân của bạn, bao gồm:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>Mã hóa dữ liệu truyền tải (HTTPS/TLS)</li>
              <li>Xác thực bằng JSON Web Token (JWT)</li>
              <li>Mã hóa mật khẩu bằng bcrypt</li>
              <li>Lưu trữ trên hạ tầng đám mây có chứng nhận bảo mật</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              6. Quyền của bạn
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Bạn có quyền:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Truy cập và xem thông tin cá nhân của mình</li>
              <li>Chỉnh sửa hoặc cập nhật thông tin hồ sơ</li>
              <li>Yêu cầu xóa tài khoản và toàn bộ dữ liệu liên quan</li>
              <li>Tắt thông báo push bất kỳ lúc nào</li>
              <li>Rút lại sự đồng ý thu thập dữ liệu</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              7. Lưu trữ dữ liệu
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi lưu trữ thông tin cá nhân của bạn trong suốt thời gian bạn sử dụng ứng dụng. 
              Khi bạn yêu cầu xóa tài khoản, chúng tôi sẽ xóa toàn bộ dữ liệu trong vòng 30 ngày.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              8. Quyền riêng tư trẻ em
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Ứng dụng TheraHome không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập 
              thông tin cá nhân từ trẻ em dưới 13 tuổi. Nếu bạn phát hiện con em mình đã cung cấp 
              thông tin cho chúng tôi, vui lòng liên hệ để chúng tôi xóa dữ liệu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              9. Camera và quyền truy cập
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Ứng dụng yêu cầu quyền truy cập camera chỉ để quét mã QR kích hoạt thiết bị TheraHome. 
              Chúng tôi không lưu trữ hình ảnh hoặc video từ camera của bạn.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              10. Thay đổi chính sách
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Mọi thay đổi sẽ được 
              thông báo qua ứng dụng hoặc email. Việc tiếp tục sử dụng ứng dụng sau khi thay đổi 
              đồng nghĩa với việc bạn chấp nhận chính sách mới.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              11. Liên hệ
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ:
            </p>
            <ul className="list-none pl-0 text-gray-600 space-y-1 mt-3">
              <li>📧 Email: support@therahome.vn</li>
              <li>🌐 Website: https://therahome.vn</li>
              <li>📱 Ứng dụng: TheraHome</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-400">
            © 2025 TheraHome. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </div>
  );
}
