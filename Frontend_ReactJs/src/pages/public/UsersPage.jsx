import { useEffect, useState } from "react";
import { SectionCard } from "../../components/common/SectionCard";
import { UserTable } from "../../components/common/UserTable";
import { getUsers } from "../../services/userService";

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const response = await getUsers();
        if (active) {
          setUsers(response.data ?? []);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <SectionCard
        title="User module"
        description="Example feature module connected to Spring Boot REST API"
      >
        <UserTable users={users} loading={loading} error={error} />
      </SectionCard>
    </div>
  );
}
