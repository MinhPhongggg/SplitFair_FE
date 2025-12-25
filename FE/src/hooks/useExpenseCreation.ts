import { useState, useEffect, useMemo } from "react";
import {
  useGetGroupMembers,
  useCreateExpense,
  useSaveExpenseShares,
} from "@/api/hooks";
import { useCurrentApp } from "@/context/app.context";
import { useToast } from "@/context/toast.context";
import { ShareInput } from "@/types/expense.types";
import { router } from "expo-router";

export type SplitMethod = "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";

export interface SplitInput {
  userId: string;
  name: string;
  value: string;
  isChecked: boolean;
  calculatedAmount?: number;
  isManual?: boolean;
  displayAmount?: string;
}

export const useExpenseCreation = (groupId: string, billId: string) => {
  const { appState } = useCurrentApp();
  const { showToast } = useToast();

  const { data: members, isLoading: isLoadingMembers } =
    useGetGroupMembers(groupId);
  const { mutate: createExpense, isPending: isCreating } =
    useCreateExpense(billId);
  const { mutate: saveShares, isPending: isSaving } =
    useSaveExpenseShares(groupId);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("EQUAL");
  const [splitInputs, setSplitInputs] = useState<SplitInput[]>([]);

  // --- HELPER FUNCTIONS ---
  // Fix: Chỉ xóa dấu chấm phân cách hàng nghìn, giữ lại số nguyên thuần túy
  const unformatNumber = (val: string) => {
    if (!val) return "";
    return val
      .toString()
      .replace(/\./g, "")
      .replace(/[^0-9]/g, "");
  };

  // Fix: Đảm bảo format chuẩn vi-VN cho số tiền
  const formatNumber = (val: string | number) => {
    if (val === "" || val === undefined || val === null) return "";
    const cleanStr = unformatNumber(val.toString());
    if (cleanStr === "") return "";
    return new Intl.NumberFormat("vi-VN").format(parseInt(cleanStr));
  };

  useEffect(() => {
    if (members) {
      const currentUserId = appState?.userId ? String(appState.userId) : "";
      if (!paidBy) {
        const isMember = members.some(
          (m) => (m.userId || m.user?.id) === currentUserId
        );
        setPaidBy(
          isMember
            ? currentUserId
            : members[0]?.userId || members[0]?.user?.id || ""
        );
      }
      setSplitInputs(
        members.map((m) => ({
          userId: m.userId || m.user?.id || "",
          name: m.userName || m.user?.userName || "Thành viên",
          value: splitMethod === "SHARES" ? "1" : "0",
          isChecked: true,
          isManual: false,
        }))
      );
    }
  }, [members, splitMethod]);

  const { calculatedShares, totalCalculated, isValid } = useMemo(() => {
    const totalAmountNum = parseInt(unformatNumber(amount)) || 0;
    const participating = splitInputs.filter((m) => m.isChecked);
    const count = participating.length || 1;
    let calcTotal = 0;

    const results = splitInputs.map((input) => {
      if (!input.isChecked)
        return { ...input, calculatedAmount: 0, displayAmount: "0đ" };

      let val = 0;
      // Lấy giá trị số thực tế từ chuỗi nhập vào
      const inputVal =
        input.value === "" ? 0 : parseInt(unformatNumber(input.value)) || 0;

      switch (splitMethod) {
        case "EQUAL":
          val = totalAmountNum / count;
          break;
        case "EXACT":
          val = inputVal; // Logic chia theo số tiền: lấy trực tiếp giá trị đã nhập
          break;
        case "PERCENTAGE":
          val = (totalAmountNum * (parseFloat(input.value) || 0)) / 100;
          break;
        case "SHARES":
          const totalShares = participating.reduce(
            (sum, i) => sum + (parseFloat(i.value) || 0),
            0
          );
          val =
            totalShares === 0
              ? 0
              : (totalAmountNum * (parseFloat(input.value) || 0)) / totalShares;
          break;
      }

      const finalVal = Math.round(val);
      calcTotal += finalVal;
      return {
        ...input,
        calculatedAmount: finalVal,
        displayAmount: `${new Intl.NumberFormat("vi-VN").format(finalVal)}đ`,
      };
    });

    return {
      calculatedShares: results,
      totalCalculated: calcTotal,
      isValid: Math.abs(calcTotal - totalAmountNum) < 10, // Chấp nhận sai số làm tròn nhỏ
    };
  }, [amount, splitMethod, splitInputs]);

  const updateInput = (uid: string, val: string) => {
    // Xử lý giá trị nhập vào tùy theo phương thức chia
    let cleanVal =
      splitMethod === "PERCENTAGE" || splitMethod === "SHARES"
        ? val.replace(/[^0-9.]/g, "")
        : unformatNumber(val);

    setSplitInputs((prev) => {
      let processedVal = cleanVal;

      // Fix: Nếu chia theo số tiền (EXACT), hiển thị dấu chấm ngay khi gõ
      if (splitMethod === "EXACT") {
        processedVal = formatNumber(cleanVal);
      }

      const nextState = prev.map((i) =>
        i.userId === uid
          ? {
              ...i,
              value: processedVal,
              isManual: processedVal !== "" && processedVal !== "0",
            }
          : i
      );

      const isPercent = splitMethod === "PERCENTAGE";
      const totalTarget = isPercent
        ? 100
        : parseInt(unformatNumber(amount)) || 0;

      // Trả về ngay nếu là các phương thức không cần chia tự động phần còn lại
      if (
        splitMethod === "EQUAL" ||
        splitMethod === "SHARES" ||
        (!isPercent && totalTarget === 0)
      ) {
        return nextState;
      }

      // Logic tính toán phần còn lại cho các thành viên chưa nhập tay
      const manualInputs = nextState.filter((i) => i.isChecked && i.isManual);
      const manualTotal = manualInputs.reduce(
        (sum, i) =>
          sum +
          (isPercent
            ? parseFloat(i.value) || 0
            : parseInt(unformatNumber(i.value)) || 0),
        0
      );

      const autoUsers = nextState.filter((i) => i.isChecked && !i.isManual);
      const remaining = Math.max(0, totalTarget - manualTotal);

      if (autoUsers.length > 0) {
        const rawShare = remaining / autoUsers.length;
        return nextState.map((i) => {
          if (i.isChecked && !i.isManual) {
            return {
              ...i,
              value: isPercent
                ? Number(rawShare.toFixed(2)).toString()
                : formatNumber(Math.round(rawShare)), // Tự động điền số tiền đã định dạng
            };
          }
          return i;
        });
      }
      return nextState;
    });
  };

  const toggleCheck = (uid: string) => {
    setSplitInputs((prev) =>
      prev.map((i) =>
        i.userId === uid
          ? { ...i, isChecked: !i.isChecked, isManual: false }
          : i
      )
    );
  };

  const changeMethod = (method: SplitMethod) => {
    setSplitMethod(method);
    setSplitInputs((prev) =>
      prev.map((i) => ({
        ...i,
        value: method === "SHARES" ? "1" : "0",
        isManual: false,
      }))
    );
  };

  const submit = () => {
    const participating = splitInputs.filter((m) => m.isChecked);
    if (participating.length === 0)
      return showToast("warning", "Thông báo", "Chọn ít nhất 1 người.");
    if (!description || !amount || !paidBy)
      return showToast("warning", "Thiếu thông tin", "Điền đủ thông tin.");

    if (!isValid)
      return showToast(
        "error",
        "Lỗi chia tiền",
        "Tổng chia không khớp hóa đơn."
      );

    createExpense(
      {
        billId,
        groupId,
        description,
        amount: parseInt(unformatNumber(amount)),
        paidBy,
        createdBy: String(appState?.userId),
        userId: paidBy,
        status: "PENDING",
      },
      {
        onSuccess: (newExp) => {
          const sharesApi: ShareInput[] = calculatedShares
            .filter((s) => s.isChecked)
            .map((s) => ({
              userId: s.userId,
              shareAmount: s.calculatedAmount || 0,
              percentage:
                splitMethod === "PERCENTAGE" ? parseFloat(s.value) || 0 : 0,
            }));
          saveShares(
            {
              expenseId: newExp.id,
              totalAmount: newExp.amount,
              paidBy: newExp.paidBy,
              shares: sharesApi,
              currency: "VND",
            },
            {
              onSuccess: () => {
                showToast("success", "Thành công", "Đã tạo chi tiêu.");
                router.replace({
                  pathname: "/(tabs)/groups/expense/[expenseId]",
                  params: { expenseId: newExp.id },
                });
              },
              onError: (e: any) => showToast("error", "Lỗi lưu", e.message),
            }
          );
        },
        onError: (e: any) => showToast("error", "Lỗi tạo", e.message),
      }
    );
  };

  return {
    members,
    isLoadingMembers,
    isPending: isCreating || isSaving,
    form: { description, amount, paidBy, splitMethod, splitInputs },
    setters: { setDescription, setAmount, setPaidBy },
    logic: { toggleCheck, updateInput, changeMethod, submit },
    calc: {
      calculatedShares,
      totalCalculated,
      isValid,
      formatNumber,
      unformatNumber,
    },
    helpers: {
      getMemberName: (m: any) => m.userName || m.user?.userName,
      getMemberId: (m: any) => m.userId || m.user?.id,
    },
  };
};
