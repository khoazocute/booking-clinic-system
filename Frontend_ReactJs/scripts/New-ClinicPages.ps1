param(
    [string]$FrontendRoot = (Split-Path -Parent $PSScriptRoot),
    [switch]$Force
)

$srcRoot = Join-Path $FrontendRoot "src"

$pageDefinitions = @(
    @{ Path = "pages/patient/browsing/SpecialtiesPage.jsx"; Title = "Specialties"; Description = "Browse specialties."; Group = "Patient / Browsing" },
    @{ Path = "pages/patient/browsing/SpecialtyDetailPage.jsx"; Title = "Specialty Detail"; Description = "View specialty details."; Group = "Patient / Browsing" },
    @{ Path = "pages/patient/browsing/DoctorsPage.jsx"; Title = "Doctors"; Description = "Browse doctors."; Group = "Patient / Browsing" },
    @{ Path = "pages/patient/browsing/DoctorDetailPage.jsx"; Title = "Doctor Detail"; Description = "View doctor details and schedule."; Group = "Patient / Browsing" },
    @{ Path = "pages/patient/browsing/BookingPage.jsx"; Title = "Booking"; Description = "Create a new appointment."; Group = "Patient / Browsing" },

    @{ Path = "pages/patient/account/ForgotPasswordPage.jsx"; Title = "Forgot Password"; Description = "Request a password reset."; Group = "Patient / Auth & Profile" },
    @{ Path = "pages/patient/account/ResetPasswordPage.jsx"; Title = "Reset Password"; Description = "Reset account password."; Group = "Patient / Auth & Profile" },
    @{ Path = "pages/patient/account/ChangePasswordPage.jsx"; Title = "Change Password"; Description = "Update the current password."; Group = "Patient / Auth & Profile" },
    @{ Path = "pages/patient/account/PatientProfilePage.jsx"; Title = "Patient Profile"; Description = "View patient profile."; Group = "Patient / Auth & Profile" },
    @{ Path = "pages/patient/account/EditPatientProfilePage.jsx"; Title = "Edit Patient Profile"; Description = "Update patient profile information."; Group = "Patient / Auth & Profile" },

    @{ Path = "pages/patient/postcare/MyAppointmentsPage.jsx"; Title = "My Appointments"; Description = "Review appointments."; Group = "Patient / Post-care" },
    @{ Path = "pages/patient/postcare/AppointmentDetailPage.jsx"; Title = "Appointment Detail"; Description = "Review appointment details."; Group = "Patient / Post-care" },
    @{ Path = "pages/patient/postcare/MedicalRecordDetailPage.jsx"; Title = "Medical Record Detail"; Description = "Review medical record details."; Group = "Patient / Post-care" },
    @{ Path = "pages/patient/postcare/MyPrescriptionsPage.jsx"; Title = "My Prescriptions"; Description = "Review prescriptions."; Group = "Patient / Post-care" },
    @{ Path = "pages/patient/postcare/PrescriptionDetailPage.jsx"; Title = "Prescription Detail"; Description = "Review prescription details."; Group = "Patient / Post-care" },
    @{ Path = "pages/patient/postcare/MyPaymentsPage.jsx"; Title = "My Payments"; Description = "Review payments."; Group = "Patient / Post-care" },
    @{ Path = "pages/patient/postcare/PaymentDetailPage.jsx"; Title = "Payment Detail"; Description = "Review payment details."; Group = "Patient / Post-care" },
    @{ Path = "pages/patient/postcare/MyReviewsPage.jsx"; Title = "My Reviews"; Description = "Review submitted ratings."; Group = "Patient / Post-care" },
    @{ Path = "pages/patient/postcare/CreateReviewPage.jsx"; Title = "Create Review"; Description = "Create a new review."; Group = "Patient / Post-care" },
    @{ Path = "pages/patient/postcare/EditReviewPage.jsx"; Title = "Edit Review"; Description = "Edit an existing review."; Group = "Patient / Post-care" },
    @{ Path = "pages/patient/postcare/MyNotificationsPage.jsx"; Title = "My Notifications"; Description = "Review notifications."; Group = "Patient / Post-care" },

    @{ Path = "pages/doctor/DoctorProfilePage.jsx"; Title = "Doctor Profile"; Description = "View doctor profile."; Group = "Doctor" },
    @{ Path = "pages/doctor/EditDoctorProfilePage.jsx"; Title = "Edit Doctor Profile"; Description = "Update doctor profile information."; Group = "Doctor" },
    @{ Path = "pages/doctor/DoctorDashboardPage.jsx"; Title = "Doctor Dashboard"; Description = "Review today's overview."; Group = "Doctor" },
    @{ Path = "pages/doctor/DoctorAppointmentsPage.jsx"; Title = "Doctor Appointments"; Description = "Review assigned appointments."; Group = "Doctor" },
    @{ Path = "pages/doctor/DoctorAppointmentDetailPage.jsx"; Title = "Doctor Appointment Detail"; Description = "Review appointment details."; Group = "Doctor" },
    @{ Path = "pages/doctor/CreateMedicalRecordPage.jsx"; Title = "Create Medical Record"; Description = "Create a new medical record."; Group = "Doctor" },
    @{ Path = "pages/doctor/DoctorMedicalRecordDetailPage.jsx"; Title = "Doctor Medical Record Detail"; Description = "Review medical record details."; Group = "Doctor" },
    @{ Path = "pages/doctor/CreatePrescriptionPage.jsx"; Title = "Create Prescription"; Description = "Create a prescription."; Group = "Doctor" },
    @{ Path = "pages/doctor/DoctorPrescriptionDetailPage.jsx"; Title = "Doctor Prescription Detail"; Description = "Review prescription details."; Group = "Doctor" },
    @{ Path = "pages/doctor/DoctorReviewsPage.jsx"; Title = "Doctor Reviews"; Description = "Review patient feedback."; Group = "Doctor" },
    @{ Path = "pages/doctor/DoctorNotificationsPage.jsx"; Title = "Doctor Notifications"; Description = "Review notifications."; Group = "Doctor" }
)

$supportDirectories = @(
    "components/patient/browsing",
    "components/patient/account",
    "components/patient/postcare",
    "components/doctor",
    "services"
)

function ConvertTo-ComponentName {
    param([string]$FileName)

    return [System.IO.Path]::GetFileNameWithoutExtension($FileName)
}

function New-PageTemplate {
    param(
        [string]$ComponentName,
        [string]$Title,
        [string]$Description,
        [string]$Group
    )

@"
function $ComponentName() {
  return (
    <section className=""page-shell"">
      <div className=""page-shell__content"">
        <span className=""page-shell__eyebrow"">$Group</span>
        <h1 className=""page-shell__title"">$Title</h1>
        <p className=""page-shell__description"">$Description</p>
      </div>
    </section>
  );
}

export default $ComponentName;
"@
}

New-Item -ItemType Directory -Path $srcRoot -Force | Out-Null

foreach ($directory in $supportDirectories) {
    $fullDirectory = Join-Path $srcRoot $directory
    New-Item -ItemType Directory -Path $fullDirectory -Force | Out-Null
}

$created = New-Object System.Collections.Generic.List[string]
$skipped = New-Object System.Collections.Generic.List[string]
$overwritten = New-Object System.Collections.Generic.List[string]

foreach ($definition in $pageDefinitions) {
    $targetPath = Join-Path $srcRoot $definition.Path
    $targetDirectory = Split-Path -Parent $targetPath
    $componentName = ConvertTo-ComponentName -FileName $targetPath
    $content = New-PageTemplate -ComponentName $componentName -Title $definition.Title -Description $definition.Description -Group $definition.Group
    $existedBefore = Test-Path $targetPath

    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null

    if ($existedBefore -and -not $Force) {
        $skipped.Add($definition.Path)
        continue
    }

    Set-Content -Path $targetPath -Value $content -Encoding UTF8

    if ($existedBefore -and $Force) {
        $overwritten.Add($definition.Path)
    } else {
        $created.Add($definition.Path)
    }
}

Write-Host ""
Write-Host "Scaffold completed." -ForegroundColor Green
Write-Host "Frontend root: $FrontendRoot"
Write-Host ""

Write-Host "Created files: $($created.Count)"
$created | ForEach-Object { Write-Host "  + $_" }

Write-Host ""
Write-Host "Skipped existing files: $($skipped.Count)"
$skipped | ForEach-Object { Write-Host "  - $_" }

Write-Host ""
Write-Host "Overwritten files: $($overwritten.Count)"
$overwritten | ForEach-Object { Write-Host "  * $_" }
