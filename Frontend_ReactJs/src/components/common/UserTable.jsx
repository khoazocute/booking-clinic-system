export function UserTable({ users, loading, error }) {
  if (loading) {
    return <p className="empty-state">Loading user list...</p>;
  }

  if (error) {
    return <p className="empty-state">{error}</p>;
  }

  if (users.length === 0) {
    return <p className="empty-state">No users found in the backend yet.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Full name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
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
