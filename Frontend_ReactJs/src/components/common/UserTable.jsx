export function UserTable({ users, loading, error }) {
  if (loading) {
    return <p className="empty-state">Đang tải danh sách người dùng...</p>;
  }

  if (error) {
    return <p className="empty-state">{error}</p>;
  }

  if (users.length === 0) {
    return <p className="empty-state">Chưa có người dùng nào trong hệ thống.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Họ tên</th>
            <th>Tên đăng nhập</th>
            <th>Email</th>
            <th>Vai trò</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.fullName}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <span className="role-chip">{user.role}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
