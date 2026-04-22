import { Edit, Trash } from "lucide-react";
import type { UsersTableViewProps } from "@/types/Users";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/helpers";

const UsersTableView = (props: UsersTableViewProps) => {

    const { user: currentUser } = useAuth();
    const { users, isLoading = false, editUser, deleteUser } = props;
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    return (
        <>
            <div className="card overflow-hidden">
                <div className="table-responsive">
                    <table className="table mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="text-center" style={{ width: '50px' }}>#</th>
                                <th>Full Name</th>
                                <th>Email address</th>
                                <th>Phone Number</th>
                                <th>User Name</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th style={{ width: '120px' }}>Create Date</th>
                                <th style={{ width: '120px' }} className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>

                            {isLoading === true && (
                                <tr>
                                    <td colSpan={9} className="text-center">Loading users...</td>
                                </tr>
                            )}

                            {isLoading !== true && (!users || users.length === 0) && (
                                <tr>
                                    <td colSpan={9} className="text-center">No users found.</td>
                                </tr>
                            )}

                            {isLoading !== true && users && users.length > 0 && users.map((user, index) => (
                                <tr key={`userTableRow-${user.userId}`}>
                                    <td className="text-center">{index + 1}</td>
                                    <td>{user.firstName} {user.lastName}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phoneNumber}</td>
                                    <td>{user.userName}</td>
                                    <td className="text-capitalize">{user.roleName}</td>
                                    <td>{user.isActive ? "Active" : "Inactive"}</td>
                                    <td>{user.createdAt ? formatDate(user.createdAt as string) : ""}</td>
                                    <td className="text-center">
                                        <button className="btn btn-sm btn-link text-dark" onClick={() => editUser && editUser(user.userId)}>
                                            <Edit size={16} />
                                        </button>

                                        <button className="btn btn-sm btn-link text-danger" onClick={() => {
                                            setSelectedUserId(user.userId);
                                            setIsModalOpen(true);
                                        }}
                                        disabled={currentUser?.userId === user.userId}
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isModalOpen} size="sm">
                <ModalHeader toggle={() => setIsModalOpen(false)}>Are you Sure?</ModalHeader>
                <ModalBody>
                    Do you really want to delete this user? This process cannot be undone.
                </ModalBody>
                <ModalFooter>
                    <button className="btn btn-secondary" onClick={() => { setIsModalOpen(false) }}>Cancel</button>
                    <button className="btn btn-danger" onClick={() => {
                        if (deleteUser) deleteUser(selectedUserId as number);
                        setIsModalOpen(false);
                    }}>Delete</button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default UsersTableView;