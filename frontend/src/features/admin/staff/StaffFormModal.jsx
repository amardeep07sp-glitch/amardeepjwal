import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STAFF_ROLES, ROLE_LABELS } from '@/constants/roles';
import { useCreateStaff } from './staffApi';

const staffSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .optional()
    .or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(STAFF_ROLES, { errorMap: () => ({ message: 'Select a role' }) }),
});

const DEFAULTS = { name: '', email: '', phone: '', password: '', role: 'staff' };

// Create-only (no self-registration anywhere in this app anymore - a Super
// Admin provisioning an account here IS the verification step). Editing an
// existing staff member's role/active status happens inline in
// StaffListPage's table instead of reopening this same form, since that's
// the only two fields updateStaffUser ever touches - see its own comment
// on why this deliberately isn't a general profile editor.
export function StaffFormModal({ open, onOpenChange }) {
  const createStaff = useCreateStaff();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(staffSchema), defaultValues: DEFAULTS });

  const onSubmit = async (values) => {
    try {
      await createStaff.mutateAsync({ ...values, phone: values.phone || undefined });
      toast.success('Staff account created successfully');
      reset(DEFAULTS);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) reset(DEFAULTS);
        onOpenChange(next);
      }}
      title="Add staff account"
      description="Creates a real, ready-to-use login - no email verification step, since you creating it here is the verification."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="staff-form" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create account'}
          </Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Full name" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" {...register('name')} />
        </FormField>
        <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" {...register('email')} />
        </FormField>
        <FormField label="Phone" htmlFor="phone" description="Optional" error={errors.phone?.message}>
          <Input id="phone" placeholder="9876543210" {...register('phone')} />
        </FormField>
        <FormField label="Temporary password" htmlFor="password" required description="Share this with them directly - they can change it after logging in." error={errors.password?.message}>
          <Input id="password" type="password" {...register('password')} />
        </FormField>
        <FormField label="Role" htmlFor="role" required error={errors.role?.message}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </form>
    </Modal>
  );
}
